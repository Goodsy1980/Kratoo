const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String },
    category: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isAnonymous: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // ✨ เพิ่มฟิลด์เก็บ Array ของคอมเมนต์ไว้ตรงนี้เลยเพื่อน
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String }, // เซฟชื่อคนคอมเมนต์ไว้โชว์เลย จะได้ไม่ต้องไปดึงซ้ำ
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);