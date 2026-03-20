const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

// 将 io 实例挂载到 app 上，供路由使用
app.set('io', io);

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 将 frontend 目录作为根目录
app.use(express.static(path.join(__dirname, '../frontend')));

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('❌ MongoDB connection error:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Submerge API is running' });
});

// 所有其他请求返回前端 index.html（支持前端路由）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Socket.IO 处理
require('./socket')(io);

server.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../frontend')}`);
});
