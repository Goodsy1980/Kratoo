// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post'); // ดึงโมเดลที่คุณเพิ่งสร้างมาใช้งาน

const app = express();

// Middleware 
app.use(cors());         // อนุญาตให้หน้าบ้านของเพื่อนคนที่ 2 ยิงข้อมูลข้ามมาหาเราได้
app.use(express.json()); // สั่งให้หลังบ้านอ่านข้อมูลรูปแบบ JSON ที่ส่งมาได้

// ------------------ โซน API ROUTES (CRUD กระทู้) ------------------

// 1. [READ] GET: ดึงกระทู้ทั้งหมดไปโชว์หน้าแรก
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // ดึงข้อมูลมาเรียงลำดับจากใหม่ไปเก่า
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงกระทู้', error: err.message });
    }
});

// 2. [CREATE] POST: รองรับเวลาคนกดสร้างกระทู้ใหม่จากหน้าเว็บ
app.post('/api/posts', async (req, res) => {
    try {
        const { category, title, content, author } = req.body;
        
        const newPost = new Post({
            category,
            title,
            content,
            author
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost); // ส่งข้อมูลที่เซฟสำเร็จกลับไปยืนยันกับหน้าบ้าน
    } catch (err) {
        res.status(400).json({ message: 'สร้างกระทู้ไม่สำเร็จ', error: err.message });
    }
});

// ----------------------------------------------------------------

// เช็คสถานะเซิร์ฟเวอร์ด่วนบนหน้าเว็บทั่วไป
app.get('/', (req, res) => {
    res.send('เซิร์ฟเวอร์หลังบ้านระบบกระทู้รันปกติแล้วครับ!');
});

// เชื่อมต่อฐานข้อมูล MongoDB (สมมติรันในเครื่องตัวเองชั่วคราวก่อน)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kreatoo_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 MongoDB เชื่อมต่อสำเร็จแล้ว! ถังเก็บข้อมูลพร้อมทำงาน'))
    .catch(err => console.error('❌ MongoDB ต่อไม่ผ่านนะ: ', err));

// เปิดการรับข้อมูลที่ Port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์รันเรียบร้อยที่: http://localhost:${PORT}`);
});