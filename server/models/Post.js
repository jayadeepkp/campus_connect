// server/models/Post.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true },

    title: { type: String, required: true },
    body: { type: String, required: true },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],

    tags: [{ type: String }]
  },
  { timestamps: true }
);

export const Post = mongoose.model('Post', postSchema);