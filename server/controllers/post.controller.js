// server/controllers/post.controller.js
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";

/**
 * Create a new post
 * Body: { userId, content }
 */
export async function createPost(req, res, next) {
  try {
    const { userId, title, body } = req.body || {};

    // basic validation
    if (!userId || !title || !body || !title.trim() || !body.trim()) {
      return res.status(400).json({
        ok: false,
        error: "userId, title, and body are required",
      });
    }

    // find the user so we can fill author, authorName, authorEmail
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: "User not found for provided userId" });
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
 * Get a single post by id
 * Params: :id
 */
export async function getPost(req, res, next) {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Edit an existing post
 * Params: :id
 * Body: { userId, content }
 */
export async function editPost(req, res, next) {
  try {
    const { userId, content } = req.body || {};
    const postId = req.params.id;

    if (!userId || !content || !content.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "userId and non-empty content are required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    // NOTE: in a real app, use auth middleware & req.user._id instead of userId from body
    if (String(post.poster) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: "You may not edit this post" });
    }

    post.text = content;
    post.edited = true;

    await post.save();

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an existing post
 * Params: :id
 * Body: { userId }
 */
export async function deletePost(req, res, next) {
  try {
    const { userId } = req.body || {};
    const postId = req.params.id;

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, error: "userId is required to delete a post" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    if (String(post.poster) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: "You may not delete this post" });
    }

    await post.remove();

    return res.json({ ok: true, data: post });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle like on a post
 * Params: :id
 * Body: { userId }
 */
export async function toggleLike(req, res, next) {
  try {
    const { userId } = req.body || {};
    const postId = req.params.id;

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, error: "userId is required to like a post" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const alreadyIndex = post.likes.findIndex(
      (id) => String(id) === String(userId)
    );

    let liked;
    if (alreadyIndex === -1) {
      post.likes.push(userId);
      liked = true;
    } else {
      post.likes.splice(alreadyIndex, 1);
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
 * Params: :id
 * Body: { userId, text }
 */
export async function addComment(req, res, next) {
  try {
    const { userId, text } = req.body || {};
    const postId = req.params.id;

    if (!userId || !text || !text.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "userId and non-empty text are required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
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
 * (Optional) Get trending posts – simple version
 * GET /api/posts/trending
 */
export async function getTrendingPosts(req, res, next) {
  try {
    // simple approach: most recent first; you can later add sorting by likes/comments
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ ok: true, data: posts });
  } catch (err) {
    next(err);
  }
}