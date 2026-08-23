const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User"); // ดึงมาไว้ข้างบนให้เป็นระเบียบ
const Notification = require("../models/Notification"); // 🔔 เพิ่มโมเดลแจ้งเตือนตรงนี้!
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

// ดึงโพสต์ (GET)
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

// สร้างโพสต์ (POST)
router.post("/", auth, async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      userId: req.user.id,
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

    const index = post.likes.indexOf(req.user.id);

    if (index === -1) {
      // ถ้ายยังไม่เคยไลค์ -> เพิ่มไลค์
      post.likes.push(req.user.id);

      // 🔔 แจ้งเตือน: มีคนมากดไลค์
      if (post.userId && post.userId.toString() !== req.user.id) {
        await Notification.create({
          recipient: post.userId,
          sender: req.user.id,
          type: "like", // ระบุ type ให้ตรงกับ Schema
          post: post._id,
          message: `ได้ถูกใจกระทู้ของคุณ`,
        });
      }
    } else {
      // ถ้าเคยไลค์แล้ว -> ถอนไลค์
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

    const user = await User.findById(req.user.id);

    const newComment = {
      userId: req.user.id,
      username: user ? user.username : "สมาชิกทั่วไป",
      text: req.body.text,
    };

    post.comments.push(newComment);
    await post.save();

    // 🔔 แจ้งเตือน: มีคนมาคอมเมนต์
    if (post.userId && post.userId.toString() !== req.user.id) {
      await Notification.create({
        recipient: post.userId,
        sender: req.user.id,
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

    const userId = req.user.id || req.user._id || req.user;
    const user = await User.findById(userId);

    const newReply = {
      text,
      userId: userId,
      username: user ? user.username : "สมาชิกทั่วไป",
      createdAt: new Date(),
    };

    comment.replies.push(newReply);
    await post.save();

    // 🔔 แจ้งเตือน: มีคนมาตอบกลับคอมเมนต์
    // เปลี่ยนมาแจ้งเตือน "เจ้าของคอมเมนต์" แทนที่จะเป็นเจ้าของโพสต์
    if (comment.userId && comment.userId.toString() !== userId.toString()) {
      await Notification.create({
        recipient: comment.userId,
        sender: userId,
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
