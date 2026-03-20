const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// 获取用户的消息列表
router.get('/', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { to: req.user.id },
                { type: 'system', to: null }
            ]
        }).populate('from', 'username uid').sort({ time: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 标记消息为已读
router.put('/:id/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: '消息不存在' });
        if (message.to && message.to.toString() !== req.user.id) {
            return res.status(403).json({ message: '无权限' });
        }
        message.isRead = true;
        await message.save();
        res.json({ message: '已标记为已读' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 发送用户消息（私聊）
router.post('/', auth, async (req, res) => {
    try {
        const { to, subject, content } = req.body;
        const message = new Message({
            type: 'user',
            from: req.user.id,
            to,
            subject,
            content,
            time: new Date()
        });
        await message.save();

        // 实时通知接收者
        const io = req.app.get('io');
        io.to(to).emit('new-message', message);

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
