const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 获取用户信息（公开）
router.get('/:uid', async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.params.uid }).select('-password');
        if (!user) return res.status(404).json({ message: '用户不存在' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 搜索用户（按名字或UID）
router.get('/search/:query', async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { username: { $regex: req.params.query, $options: 'i' } },
                { uid: { $regex: req.params.query, $options: 'i' } }
            ]
        }).select('-password').limit(20);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 更新用户信息（主页风格等）
router.put('/me', auth, async (req, res) => {
    try {
        const { avatar, homepageStyle } = req.body;
        const user = await User.findById(req.user.id);
        if (avatar) user.avatar = avatar;
        if (homepageStyle) user.homepageStyle = homepageStyle;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：提升/撤销管理员
router.put('/:uid/role', auth, admin, async (req, res) => {
    try {
        const { role } = req.body; // 'admin' 或 'user'
        const targetUser = await User.findOne({ uid: req.params.uid });
        if (!targetUser) return res.status(404).json({ message: '用户不存在' });
        if (targetUser.role === 'owner') return res.status(403).json({ message: '不能修改所有者权限' });
        targetUser.role = role;
        await targetUser.save();
        res.json({ message: `用户 ${targetUser.username} 权限已改为 ${role}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：封禁用户（简单实现）
router.put('/:uid/ban', auth, admin, async (req, res) => {
    try {
        const targetUser = await User.findOne({ uid: req.params.uid });
        if (!targetUser) return res.status(404).json({ message: '用户不存在' });
        if (targetUser.role === 'owner') return res.status(403).json({ message: '不能封禁所有者' });
        targetUser.isBanned = true; // 假设添加了 isBanned 字段
        await targetUser.save();
        res.json({ message: '用户已封禁' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
