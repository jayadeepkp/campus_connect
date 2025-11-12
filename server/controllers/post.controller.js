import { Post } from "../models/Post.js";

export async function createPost(req, res, next) {
  try {
    const { userId, content } = req.body || {};
    if (!userId || !content) {
      return res.status(400).json({ ok: false, error: "Invalid post" });
    }

    const post = await Post.create({ text: content, poster: userId });

    return res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function getPost(req, res, next) {
  try {
    const postId = req.params.id;
    const post = await Post.findByid(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    return res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function editPost(req, res, next) {
  try {
    const { userId, content } = req.body || {};
    const postID = req.params.id;
    const post = await Post.findByid(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" })
    }

    if (post.poster != userId) {
      return res.status(403).json({ ok: false, error: "You may not delete this post" });
    }

    post.text = content;
    post.edited = true;

    await post.save();

    return res.json(post);
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { userId } = req.body || {};
    const postID = req.params.id;
    const post = await Post.findByid(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" })
    }

    if (post.poster != userId) {
      return res.status(403).json({ ok: false, error: "You may not delete this post" });
    }
    
    await post.remove();

    return res.json(post);
  } catch (err) {
    next(err);
  }
}
