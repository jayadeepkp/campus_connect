// server/controllers/post.controller.js
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";

/**
 * Create a new post
 * POST /api/posts
 * Body: { title, body }
 */
export async function createPost(req, res, next) {
  try {
    const { title, body } = req.body || {};
    const user = req.user; // from requireAuth

    if (!title || !body || !title.trim() || !body.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "title and body are required" });
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
 * Global feed: all posts
 * GET /api/posts/feed
 */
export async function getFeed(req, res, next) {
  try {
    const posts = await Post.find({ author: { $nin: req.user.blockedUsers}})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ ok: true, data: posts });
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
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    const blockedIndex = req.user.blockedUsers.findIndex(
      (id) => String(id) === String(post.author)
    );
    
    let fromBlockedUser;
    if (blockedIndex === -1)
      fromBlockedUser = false;
    else
      fromBlockedUser = true;
    
    return res.json({ ok: true, data: { fromBlockedUser, ...post }});
  } catch (err) {
    next(err);
  }
}

/**
 * Get only my posts
 * GET /api/posts/mine
 */
export async function getMyPosts(req, res, next) {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, data: posts });
  } catch (err) {
    next(err);
  }
}

/**
 * Edit an existing post
 * PUT /api/posts/:id
 */
export async function editPost(req, res, next) {
  try {
    const { title, body } = req.body || {};
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    if (String(post.author) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: "You may not edit this post" });
    }

    if (title && title.trim()) post.title = title;
    if (body && body.trim()) post.body = body;
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
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    // Only the author can delete the post
    if (String(post.author) !== String(userId)) {
      return res
        .status(403)
        .json({ ok: false, error: "You may not delete this post" });
    }

    // Mongoose 7+: use deleteOne instead of remove
    await post.deleteOne();

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
    const user = req.user;
    const userId = user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    if (!Array.isArray(post.likes)) post.likes = [];

    const index = post.likes.findIndex(
      (id) => String(id) === String(userId)
    );

    let liked;
    if (index === -1) {
      post.likes.push(userId);
      liked = true;

      // Notify post author (only if different user)
      if (String(post.author) !== String(userId)) {
        await Notification.create({
          user: post.author,
          fromUser: userId,
          type: "like",
          post: post._id,
          message: `${user.name} liked your post "${post.title}"`,
        });
      }
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
 * Add a comment
 * POST /api/posts/:id/comment
 * Body: { text }
 */
export async function addComment(req, res, next) {
  try {
    const postId = req.params.id;
    const { text } = req.body || {};
    const user = req.user;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Comment text required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    if (!Array.isArray(post.comments)) post.comments = [];

    const newComment = {
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      text,
      replies: [],
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const comment = post.comments[post.comments.length - 1];

    // Notify post author (if not same user)
    if (String(post.author) !== String(user._id)) {
      await Notification.create({
        user: post.author,
        fromUser: user._id,
        type: "comment",
        post: post._id,
        commentId: comment._id,
        message: `${user.name} commented on your post "${post.title}"`,
      });
    }

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
 * Reply to a comment
 * POST /api/posts/:postId/comment/:commentId/reply
 * Body: { text }
 */
export async function replyToComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body || {};
    const user = req.user;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Reply text required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ ok: false, error: "Comment not found" });
    }

    if (!Array.isArray(comment.replies)) comment.replies = [];

    const reply = {
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      text,
      createdAt: new Date(),
    };

    comment.replies.push(reply);
    await post.save();

    const lastReply = comment.replies[comment.replies.length - 1];

    // Notify comment owner (if not same user)
    if (String(comment.user) !== String(user._id)) {
      await Notification.create({
        user: comment.user,
        fromUser: user._id,
        type: "reply",
        post: post._id,
        commentId: comment._id,
        message: `${user.name} replied to your comment on "${post.title}"`,
      });
    }

    return res.json({
      ok: true,
      data: {
        postId: post._id,
        commentId: comment._id,
        replies: comment.replies,
        reply: lastReply,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a comment
 * DELETE /api/posts/:postId/comment/:commentId
 * Only comment owner or post author may delete
 */
export async function deleteComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ ok: false, error: "Comment not found" });
    }

    const isPostAuthor = String(post.author) === String(userId);
    const isCommentAuthor = String(comment.user) === String(userId);

    if (!isPostAuthor && !isCommentAuthor) {
      return res.status(403).json({
        ok: false,
        error: "You may not delete this comment",
      });
    }

    comment.deleteOne();
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
 * Simple trending posts (by newest for now)
 * GET /api/posts/trending/all
 */
export async function getTrendingPosts(req, res, next) {
  try {
    const posts = await Post.find({ author: { $nin: req.user.blockedUsers }})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ ok: true, data: posts });
  } catch (err) {
    next(err);
  }
}
