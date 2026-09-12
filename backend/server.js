const dns = require('dns');

// 1. บังคับให้ Node.js ใช้ IPv4 ก่อน IPv6 (แก้ปัญหา localhost/Node v18+ ค้าง)
dns.setDefaultResultOrder('ipv4first');

// 2. ตั้งค่าให้ Node.js ชี้ไปที่ Google DNS โดยตรง (แก้ปัญหา querySrv ENOTFOUND / เชื่อมต่อ MongoDB Atlas ไม่ได้)
dns.setServers(['8.8.8.8', '8.8.4.4']);


require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ดึง User Model
const User = require("./models/User");

const app = express();

// 🛠️ Middleware
app.use(cors());
app.use(express.json());

// 🔌 ต่อสายตรงเข้ากับ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔌 เชื่อมต่อฐานข้อมูล MongoDB สำเร็จแล้วเพื่อน!"))
  .catch((err) =>
    console.error("❌ มอนโกต่อไม่ติด! ตรวจสอบ Error ตรงนี้:", err)
  );

// 🏠 Root Endpoint สำหรับเช็กสถานะเซิร์ฟเวอร์
app.get("/", (req, res) => {
  res.send("🚀 SchoolConnect API Server running successfully!");
});

// ==========================================
// 📝 1. API สำหรับสมัครสมาชิก (REGISTER)
// ==========================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

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

// 📌 ลงทะเบียนเปิดเส้นทางระบบต่างๆ
app.use("/api/posts", require("./routes/posts"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/users", require("./routes/users"));

// 🏃 สั่งให้เซิร์ฟเวอร์รัน
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 เซิร์ฟเวอร์รันอยู่ที่พอร์ต: ${PORT}`);
});