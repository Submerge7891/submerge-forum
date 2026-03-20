const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { filterSensitiveWords } = require('../utils/sensitiveWords');

// 获取帖子列表（支持排序、筛选）
router.get('/', async (req, res) => {
    try {
        const { sort = 'time', tag, author, keyword, page = 1, limit = 20 } = req.query;
        let query = {};
        if (tag) query.tags = tag;
        if (author) query.author = author;
        if (keyword) query.$text = { $search: keyword };
        let sortOption = {};
        if (sort === 'hot') sortOption = { likes: -1 };
        else if (sort === 'top') sortOption = { isTop: -1, time: -1 };
        else sortOption = { time: -1 };
        const posts = await Post.find(query)
            .populate('author', 'username uid')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await Post.countDocuments(query);
        res.json({ posts, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 发布帖子
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ message: '用户不存在' });

        // 敏感词检测
        const sensitive = filterSensitiveWords(content);
        if (sensitive.length > 0) {
            return res.status(400).json({ message: '包含敏感词汇', sensitive });
        }

        const post = new Post({
            title,
            content,
            author: req.user.id,
            tags,
            time: new Date(),
            lastEditTime: new Date()
        });
        await post.save();

        // 自动水贴标签：如果字数少于50且不是管理员/所有者
        if (content.length < 50 && user.role === 'user') {
            if (!post.tags.includes('水贴')) {
                post.tags.push('水贴');
                await post.save();
            }
        }
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 获取单个帖子
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username uid')
            .populate('comments.author', 'username uid');
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 更新帖子
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        if (post.author.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: '无权限修改' });
        }
        // 敏感词检测
        const sensitive = filterSensitiveWords(content);
        if (sensitive.length > 0) {
            return res.status(400).json({ message: '包含敏感词汇', sensitive });
        }
        post.title = title || post.title;
        post.content = content || post.content;
        post.tags = tags || post.tags;
        post.lastEditTime = new Date();
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 删除帖子
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        if (post.author.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
            return res.status(403).json({ message: '无权限删除' });
        }
        await post.deleteOne();
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 点赞/取消点赞
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        const userId = req.user.id;
        const liked = post.likedBy.includes(userId);
        if (liked) {
            post.likedBy.pull(userId);
            post.likes -= 1;
        } else {
            post.likedBy.push(userId);
            post.likes += 1;
        }
        await post.save();
        res.json({ likes: post.likes, liked: !liked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 收藏/取消收藏
router.post('/:id/collect', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postId = req.params.id;
        const collected = user.collections.includes(postId);
        if (collected) {
            user.collections.pull(postId);
        } else {
            user.collections.push(postId);
        }
        await user.save();
        res.json({ collected: !collected });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 评论
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });

        // 敏感词检测
        const sensitive = filterSensitiveWords(content);
        if (sensitive.length > 0) {
            return res.status(400).json({ message: '包含敏感词汇', sensitive });
        }

        const comment = {
            author: req.user.id,
            content,
            time: new Date(),
            likes: 0,
            likedBy: []
        };
        post.comments.push(comment);
        await post.save();

        // 发送通知给作者
        if (post.author.toString() !== req.user.id) {
            const message = new Message({
                type: 'user',
                from: req.user.id,
                to: post.author,
                subject: '新评论',
                content: `用户 ${req.user.id} 评论了你的帖子《${post.title}》`,
                relatedPost: post._id,
                time: new Date()
            });
            await message.save();
            const io = req.app.get('io');
            io.to(post.author.toString()).emit('new-message', message);
        }

        res.status(201).json(comment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 评论点赞
router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: '评论不存在' });
        const userId = req.user.id;
        const liked = comment.likedBy.includes(userId);
        if (liked) {
            comment.likedBy.pull(userId);
            comment.likes -= 1;
        } else {
            comment.likedBy.push(userId);
            comment.likes += 1;
        }
        await post.save();
        res.json({ likes: comment.likes, liked: !liked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 举报帖子
router.post('/:id/report', auth, async (req, res) => {
    try {
        const { reason } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        post.reports.push({
            reporter: req.user.id,
            reason,
            time: new Date()
        });
        await post.save();

        // 给管理员发消息
        const admins = await User.find({ role: { $in: ['admin', 'owner'] } });
        for (const admin of admins) {
            const message = new Message({
                type: 'report',
                from: req.user.id,
                to: admin._id,
                subject: '帖子举报',
                content: `用户举报了帖子《${post.title}》，原因：${reason}`,
                relatedPost: post._id,
                time: new Date()
            });
            await message.save();
            const io = req.app.get('io');
            io.to(admin._id.toString()).emit('new-message', message);
        }

        res.json({ message: '举报已提交' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：封禁帖子
router.put('/:id/ban', auth, admin, async (req, res) => {
    try {
        const { reason } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        post.isBanned = !post.isBanned;
        await post.save();

        // 通知作者
        const message = new Message({
            type: 'system',
            to: post.author,
            subject: post.isBanned ? '帖子被封禁' : '帖子已解封',
            content: `您的帖子《${post.title}》已被${post.isBanned ? '封禁' : '解封'}。原因：${reason || '无'}`,
            relatedPost: post._id
        });
        await message.save();
        const io = req.app.get('io');
        io.to(post.author.toString()).emit('new-message', message);

        res.json({ message: post.isBanned ? '帖子已封禁' : '帖子已解封' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：设为精华
router.put('/:id/essence', auth, admin, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        post.isEssence = !post.isEssence;
        await post.save();
        res.json({ message: post.isEssence ? '已设为精华' : '已取消精华' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 管理员：置顶
router.put('/:id/top', auth, admin, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: '帖子不存在' });
        post.isTop = !post.isTop;
        await post.save();
        res.json({ message: post.isTop ? '已置顶' : '已取消置顶' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
