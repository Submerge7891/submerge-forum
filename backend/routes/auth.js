const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // 检查用户是否存在
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: '用户名或邮箱已存在' });
        }
        
        // 确定角色：如果用户名是 Submerge 且邮箱匹配，设为所有者
        // 注意：这里简化处理，实际生产环境建议通过环境变量或初始化脚本创建所有者
        let role = 'user';
        if (username === 'Submerge' && email === 'admin@example.com') {
            role = 'owner';
        }
        
        // 生成 UID
        const uid = User.generateUID(username, role);
        
        // 创建新用户
        const user = new User({
            username,
            email,
            password,
            role,
            uid,
            avatar: username.charAt(0).toUpperCase()
        });
        
        await user.save();
        
        // 生成 JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                uid: user.uid,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('注册错误:', err);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: '用户名或密码错误' });
        }
        
        // 生成 JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                uid: user.uid,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('登录错误:', err);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

module.exports = router;
