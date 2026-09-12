const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

// Middleware ตรวจสอบ Token
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res
      .status(401)
      .json({ message: "ไม่มี Token, กรุณาเข้าสู่ระบบก่อน" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
};

// 📌 ดึงโพสต์ทั้งหมด (GET)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📌 สร้างโพสต์ใหม่ (POST) - [แก้ไขเพิ่ม isAnonymous แล้ว]
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      userId: userId,
      isAnonymous: req.body.isAnonymous // 🎯 จุดที่แก้ไข: เพิ่มการรับค่าซ่อนตัวตนจากหน้าบ้าน
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 💥 API สำหรับ กดไลค์ / ถอนไลค์ (Toggle Like)
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "ไม่พบกระทู้นี้" });

    const currentUserId = (req.user.id || req.user._id).toString();

    // ปรับใช้ findIndex เพื่อเช็ก ObjectId กับ String ได้ถูกต้อง
    const index = post.likes.findIndex(
      (likeId) => likeId.toString() === currentUserId
    );

    if (index === -1) {
      // ยังไม่เคยไลค์ -> เพิ่มไลค์
      post.likes.push(currentUserId);

      // 🔔 แจ้งเตือนเจ้าของกระทู้
      if (post.userId && post.userId.toString() !== currentUserId) {
        await Notification.create({
          recipient: post.userId,
          sender: currentUserId,
          type: "like",
          post: post._id,
          message: `ได้ถูกใจกระทู้ของคุณ`,
        });
      }
    } else {
      // เคยไลค์แล้ว -> ถอนไลค์
      post.likes.splice(index, 1);
    }

    await post.save();
    res.json({ message: "อัปเดตไลค์สำเร็จ", likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 💬 API สำหรับส่งคอมเมนต์ใต้โพสต์
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "ไม่พบกระทู้นี้" });

    const currentUserId = req.user.id || req.user._id;
    const user = await User.findById(currentUserId);

    const newComment = {
      userId: currentUserId,
      username: user ? user.username : "สมาชิกทั่วไป",
      text: req.body.text,
    };

    post.comments.push(newComment);
    await post.save();

    // 🔔 แจ้งเตือนเจ้าของกระทู้
    if (post.userId && post.userId.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: post.userId,
        sender: currentUserId,
        type: "comment",
        post: post._id,
        message: `ได้แสดงความคิดเห็นในกระทู้ของคุณ`,
      });
    }

    res.json({ message: "เพิ่มคอมเมนต์สำเร็จ", comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔥 API สำหรับ ตอบกลับคอมเมนต์ย่อย (Reply)
router.post("/:postId/comments/:commentId/replies", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "กรุณากรอกข้อความตอบกลับ" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "ไม่พบกระทู้นี้" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "ไม่พบคอมเมนต์นี้" });

    const currentUserId = req.user.id || req.user._id || req.user;
    const user = await User.findById(currentUserId);

    const newReply = {
      text,
      userId: currentUserId,
      username: user ? user.username : "สมาชิกทั่วไป",
      createdAt: new Date(),
    };

    comment.replies.push(newReply);
    await post.save();

    // 🔔 แจ้งเตือนเจ้าของคอมเมนต์
    if (comment.userId && comment.userId.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: comment.userId,
        sender: currentUserId,
        type: "reply",
        post: post._id,
        message: `ได้ตอบกลับความคิดเห็นของคุณ`,
      });
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;