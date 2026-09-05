const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Middleware เช็ก Token
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'ไม่มี Token กรุณาล็อกอินก่อน' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// 🔔 ดึงรายการแจ้งเตือนของผู้ใช้ที่ล็อกอินอยู่
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user;
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'username')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือน' });
    }
});

// ✅ กดอ่านแจ้งเตือนทั้งหมด
router.put('/read-all', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id || req.user;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        res.json({ message: 'อ่านทั้งหมดแล้ว' });
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
});

module.exports = router;