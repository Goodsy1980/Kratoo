const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "กรุณากรอกชื่อผู้ใช้งาน"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "กรุณากรอกรหัสผ่าน"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
