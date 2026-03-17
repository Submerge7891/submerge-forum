const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
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

// 基础路由
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Submerge API is running' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, '../frontend')}`);
});
