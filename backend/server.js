const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ดึง User Model ที่เราสร้างไว้มาใช้งาน
const User = require("./models/User");

const app = express();

// 🛠️ Middleware
app.use(cors());
app.use(express.json());



// 📌 ลงทะเบียนเปิดเส้นทางสำหรับระบบกระทู้ (Posts)
const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);

// 🔌 ต่อสายตรงเข้ากับ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔌 เชื่อมต่อฐานข้อมูล MongoDB สำเร็จแล้วเพื่อน!"))
  .catch((err) =>
    console.error("❌ มอนโกต่อไม่ติด! ตรวจสอบ Error ตรงนี้:", err),
  );

// ==========================================
// 📝 1. API สำหรับสมัครสมาชิก (REGISTER)
// ==========================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ตรวจสอบว่ามีชื่อผู้ใช้นี้ในระบบหรือยัง
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว" });
    }

    // 🔐 เข้ารหัสผ่าน (Hashing) ก่อนเซฟลงฐานข้อมูลเพื่อความปลอดภัย
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // บันทึกผู้ใช้ใหม่ลง MongoDB
    const newUser = new User({
      username,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จแล้ว!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์หลังบ้าน" });
  }
});

// ==========================================
// 🔑 2. API สำหรับเข้าสู่ระบบ (LOGIN)
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. ค้นหาชื่อผู้ใช้ในฐานข้อมูล
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
    }

    // 2. ตรวจสอบรหัสผ่านที่ผู้ใช้พิมพ์มา เทียบกับรหัสที่เข้ารหัสไว้ในฐานข้อมูล
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // 3. ถ้าถูกหมด ให้สร้างตั๋วผ่านทาง (JWT Token) ให้หน้าบ้านเอาไปเก็บ
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }, // ตั๋วมีอายุใช้งาน 1 วัน
    );

    // 4. ส่งข้อมูลกลับไปให้หน้าบ้านใช้งาน
    res.json({
      message: "เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ!",
      token,
      username: user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์หลังบ้าน" });
  }
});

// 🏃 สั่งให้เซิร์ฟเวอร์รัน
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 เซิร์ฟเวอร์รันอยู่ที่: http://localhost:${PORT}`);
});
