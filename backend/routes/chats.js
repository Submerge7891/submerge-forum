const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// 创建聊天
router.post('/', auth, async (req, res) => {
    try {
        const { title } = req.body;
        const user = await User.findById(req.user.id);
        const chat = new Chat({
            title: title || `${user.username}的聊天贴`,
            creator: req.user.id,
            members: [req.user.id],
            createdAt: new Date(),
            lastMessageAt: new Date()
        });
        await chat.save();
        res.status(201).json(chat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 获取聊天列表（用户可见的）
router.get('/', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            $or: [
                { members: req.user.id },
                { creator: req.user.id },
                { isBanned: false }
            ]
        }).populate('creator', 'username uid').populate('members', 'username uid');
        res.json(chats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 获取单个聊天详情
router.get('/:id', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('creator', 'username uid')
            .populate('members', 'username uid')
            .populate('messages.author', 'username uid');
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        // 检查用户是否有权限查看（成员、创建者、管理员）
        const user = await User.findById(req.user.id);
        if (!chat.members.some(m => m._id.toString() === req.user.id) && chat.creator._id.toString() !== req.user.id && user.role !== 'admin' && user.role !== 'owner') {
            return res.status(403).json({ message: '无权限查看' });
        }
        res.json(chat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 申请加入
router.post('/:id/request', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        if (chat.members.includes(req.user.id)) return res.status(400).json({ message: '已是成员' });
        if (chat.joinRequests.some(r => r.user.equals(req.user.id) && r.status === 'pending')) {
            return res.status(400).json({ message: '已提交申请，请等待' });
        }
        chat.joinRequests.push({ user: req.user.id, time: new Date(), status: 'pending' });
        await chat.save();

        // 通知创建者
        const io = req.app.get('io');
        io.to(chat.creator.toString()).emit('join-request', { chatId: chat._id, userId: req.user.id });

        res.json({ message: '申请已提交' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 同意/拒绝申请
router.post('/:id/request/:userId/:action', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        const user = await User.findById(req.user.id);
        if (!chat.creator.equals(req.user.id) && user.role !== 'owner') {
            return res.status(403).json({ message: '无权限' });
        }
        const request = chat.joinRequests.find(r => r.user.equals(req.params.userId) && r.status === 'pending');
        if (!request) return res.status(404).json({ message: '申请不存在' });
        if (req.params.action === 'approve') {
            request.status = 'approved';
            chat.members.push(req.params.userId);
            // 通知用户
            const io = req.app.get('io');
            io.to(req.params.userId).emit('request-approved', { chatId: chat._id });
        } else {
            request.status = 'rejected';
        }
        await chat.save();
        res.json({ message: '操作成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 邀请用户
router.post('/:id/invite', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        if (!chat.creator.equals(req.user.id)) {
            return res.status(403).json({ message: '只有创建者可以邀请' });
        }
        if (chat.members.includes(userId)) return res.status(400).json({ message: '用户已是成员' });
        if (chat.invites.some(inv => inv.user.equals(userId) && inv.status === 'pending')) {
            return res.status(400).json({ message: '已发送过邀请' });
        }
        chat.invites.push({ user: userId, inviter: req.user.id, time: new Date(), status: 'pending' });
        await chat.save();

        // 通知被邀请者
        const io = req.app.get('io');
        io.to(userId).emit('chat-invite', { chatId: chat._id, inviter: req.user.id });

        res.json({ message: '邀请已发送' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 接受邀请
router.post('/:id/invite/:inviteId/accept', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        const invite = chat.invites.id(req.params.inviteId);
        if (!invite || invite.user.toString() !== req.user.id) return res.status(403).json({ message: '无权限' });
        if (invite.status !== 'pending') return res.status(400).json({ message: '邀请已失效' });
        invite.status = 'accepted';
        chat.members.push(req.user.id);
        await chat.save();
        res.json({ message: '加入成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 发送消息
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        if (!chat.members.includes(req.user.id)) return res.status(403).json({ message: '不是成员' });
        const message = {
            author: req.user.id,
            content,
            time: new Date()
        };
        chat.messages.push(message);
        chat.lastMessageAt = new Date();
        await chat.save();

        // 实时广播给所有成员
        const io = req.app.get('io');
        chat.members.forEach(memberId => {
            io.to(memberId.toString()).emit('chat-message', { chatId: chat._id, message });
        });

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：封禁聊天
router.put('/:id/ban', auth, admin, async (req, res) => {
    try {
        const { reason } = req.body;
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: '聊天不存在' });
        chat.isBanned = !chat.isBanned;
        await chat.save();

        // 通知创建者
        const message = new Message({
            type: 'system',
            to: chat.creator,
            subject: chat.isBanned ? '聊天被封禁' : '聊天已解封',
            content: `您的聊天《${chat.title}》已被${chat.isBanned ? '封禁' : '解封'}。原因：${reason || '无'}`,
            relatedChat: chat._id
        });
        await message.save();
        const io = req.app.get('io');
        io.to(chat.creator.toString()).emit('new-message', message);

        res.json({ message: chat.isBanned ? '聊天已封禁' : '聊天已解封' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
