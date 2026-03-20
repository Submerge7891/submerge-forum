const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    time: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isBanned: { type: Boolean, default: false }
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    time: { type: Date, default: Date.now },
    lastEditTime: { type: Date },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    isBanned: { type: Boolean, default: false },
    isEssence: { type: Boolean, default: false },
    isTop: { type: Boolean, default: false },
    reports: [{
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        time: { type: Date, default: Date.now },
        processed: { type: Boolean, default: false }
    }]
});

module.exports = mongoose.model('Post', postSchema);
