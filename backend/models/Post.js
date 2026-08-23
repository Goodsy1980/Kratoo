const mongoose = require('mongoose');

// ↪️ จุดที่ 1: เพิ่ม Schema สำหรับเก็บคำตอบกลับย่อย (Reply) ไว้ด้านบนสุด
const replySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String },
    category: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAnonymous: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // ✨ โครงสร้างคอมเมนต์เดิมของนาย
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String }, 
        text: { type: String, required: true },
        
        // 🎯 จุดที่ 2: ฝังอาเรย์ของ Reply เข้าไปข้างในคอมเมนต์หลักตรงนี้เลยเพื่อน
        replies: [replySchema], 
        
        createdAt: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);