const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken'); // 1. นำเข้า jwt เพิ่มที่หัวแถว

// 2. สร้างฟังก์ชัน (Middleware) ตรวจสอบ Token ชั่วคราวในไฟล์นี้
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'ไม่มี Token, กรุณาเข้าสู่ระบบก่อน' });

    try {
        // 💡 หมายเหตุ: 'SECRET_KEY' ให้เปลี่ยนให้ตรงกับตัวที่นายใช้ในตอนล็อกอิน (Login) นะครับ
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY'); 
        req.user = decoded; // เก็บข้อมูลผู้ใช้ที่ถอดรหัสได้ (เช่น id) ไว้ใน req.user
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// 3. ตอนดึงโพสต์ (GET): สั่งให้ดึงชื่อผู้ใช้ (username) มาด้วย
router.get('/', async (req, res) => {
    try {
        // ใช้ .populate('userId', 'username') เพื่อดึงชื่อแทนที่จะได้แค่ไอดีเปล่า ๆ
        const posts = await Post.find().populate('userId', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. ตอนสร้างโพสต์ (POST): ใส่คำว่า auth แทรกกลาง เพื่อล็อกให้ต้องล็อกอินก่อนโพสต์
router.post('/', auth, async (req, res) => {
    try {
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content,
            category: req.body.category,
            userId: req.user.id // ✨ เอา ID ของคนที่ล็อกอินอยู่บันทึกลงฐานข้อมูล
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



    // 💥 API สำหรับ กดไลค์ / ถอนไลค์ (Toggle Like)
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'ไม่พบกระทู้นี้' });

        // ตรวจสอบว่า User คนนี้เคยมากดไลค์ไปหรือยัง
        const index = post.likes.indexOf(req.user.id);
        
        if (index === -1) {
            // ถ้ายยังไม่เคยไลค์ -> ให้เพิ่ม ID ยูสเซอร์เข้าไป (กดไลค์)
            post.likes.push(req.user.id);
        } else {
            // ถ้าเคยไลค์แล้ว -> ให้เอา ID ออกจากอาร์เรย์ (ถอนไลค์)
            post.likes.splice(index, 1);
        }

        await post.save();
        res.json({ message: 'อัปเดตไลค์สำเร็จ', likesCount: post.likes.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




    const User = require('../models/User'); // 💡 อย่าลืมเช็กว่ามีบรรทัดนำเข้าโมเดล User หรือยัง (ถ้ามีแล้วไม่ต้องใส่ซ้ำ)

// 💬 API สำหรับส่งคอมเมนต์ใต้โพสต์
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'ไม่พบกระทู้นี้' });

        // ไปดึงชื่อผู้ใช้ปัจจุบันจากฐานข้อมูลมาใช้บันทึกในคอมเมนต์
        const user = await User.findById(req.user.id);
        
        const newComment = {
            userId: req.user.id,
            username: user ? user.username : 'สมาชิกทั่วไป',
            text: req.body.text // ข้อความคอมเมนต์ที่ส่งมาจากหน้าบ้าน
        };

        post.comments.push(newComment); // ยัดคอมเมนต์ใหม่ลงอาร์เรย์
        await post.save(); // บันทึกลงฐานข้อมูล

        res.json({ message: 'เพิ่มคอมเมนต์สำเร็จ', comments: post.comments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;