const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // เจ้าของกระทู้ที่รับแจ้งเตือน
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },    // คนที่มาคอมเมนต์
    type: { type: String, enum: ['comment', 'reply', 'like'], required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);