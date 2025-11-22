// server/controllers/post.controller.js
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';

/**
 * Create a new post
 * POST /api/posts
 * Body: { title, body }
 * Auth: required (req.user from requireAuth)
 */
export async function createPost(req, res, next) {
  try {
    const { title, body } = req.body || {};
    const user = req.user; // came from auth middleware

    if (!title || !body || !title.trim() || !body.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: 'title and body are required' });
    }

    const post = await Post.create({
      author: user._id,
      authorName: user.name,
      authorEmail: user.email,
      title,
      body,
      likes: [],
      comments: [],
      tags: [],
    });

    return res.status(201).json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single post
 * GET /api/posts/:id
 */
export async function getPost(req, res, next) {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).lean();

    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Edit an existing post
 * PUT /api/posts/:id
 * Body: { title?, body? }
 */
export async function editPost(req, res, next) {
  try {
    const { title, body } = req.body || {};
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    // Only the author can edit
    if (String(post.author) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: 'You may not edit this post' });
    }

    if (title && title.trim()) {
      post.title = title;
    }
    if (body && body.trim()) {
      post.body = body;
    }
    post.edited = true;

    await post.save();

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a post
 * DELETE /api/posts/:id
 */
export async function deletePost(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    // Only the author can delete
    if (String(post.author) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: 'You may not delete this post' });
    }

    await post.remove();

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle like on a post
 * POST /api/posts/:id/like
 */
export async function toggleLike(req, res, next) {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const index = post.likes.findIndex(
      (id) => String(id) === String(userId)
    );

    let liked;
    if (index === -1) {
      post.likes.push(userId);
      liked = true;
    } else {
      post.likes.splice(index, 1);
      liked = false;
    }

    await post.save();

    return res.json({
      ok: true,
      data: {
        liked,
        likesCount: post.likes.length,
        postId: post._id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a comment to a post
 * POST /api/posts/:id/comment
 * Body: { text }
 */
export async function addComment(req, res, next) {
  try {
    const postId = req.params.id;
    const { text } = req.body || {};
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: 'Comment text required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' });
    }

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    post.comments.push({
      userId,
      text,
      createdAt: new Date(),
    });

    await post.save();

    return res.json({
      ok: true,
      data: {
        postId: post._id,
        commentsCount: post.comments.length,
        comments: post.comments,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get trending posts (simple version)
 * GET /api/posts/trending/all
 */
export async function getTrendingPosts(req, res, next) {
  try {
    // Simple: newest first. You can improve later using likes/comments.
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ ok: true, data: posts });
  } catch (err) {
    next(err);
  }
}