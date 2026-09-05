const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware ตรวจสอบ Token
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "ไม่มี Token, กรุณาเข้าสู่ระบบก่อน" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

// 👤 API ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (GET /api/users/profile)
router.get("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    // ค้นหาผู้ใช้จาก ID ใน Token (ไม่เอา password ส่งกลับไป)
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้นี้" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;