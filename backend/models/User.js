const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, required: true, unique: true },
    role: { type: String, enum: ['owner', 'admin', 'user'], default: 'user' },
    avatar: { type: String, default: '' },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    likedComments: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: { type: Date, default: Date.now }
});

// 密码加密
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// 验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 生成UID的静态方法
userSchema.statics.generateUID = function(username, role) {
    if (username === 'Submerge') return 'Submerge'; // 所有者特殊UID
    if (role === 'admin') return 'T' + Math.floor(Math.random() * 1000000);
    return Math.floor(Math.random() * 1000000).toString(); // 纯数字
};

module.exports = mongoose.model('User', userSchema);
