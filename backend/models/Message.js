const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    type: { type: String, enum: ['system', 'user', 'report'] },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: String,
    content: String,
    time: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    relatedChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }
});

module.exports = mongoose.model('Message', messageSchema);
