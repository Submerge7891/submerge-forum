const Message = require('../models/Message');
const User = require('../models/User');

module.exports = (io) => {
    const onlineUsers = new Map(); // userId -> socketId

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('user-login', (userId) => {
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            io.emit('online-count', onlineUsers.size);
        });

        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
            io.emit('online-count', onlineUsers.size);
            console.log('Client disconnected:', socket.id);
        });

        // 其他自定义事件（如聊天消息已在路由中通过 io.to 发送）
    });
};
