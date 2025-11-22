// server/routes/post.routes.js
import { Router } from 'express';
import {
  createPost,
  getPost,
  editPost,
  deletePost,
  toggleLike,
  addComment,
  getTrendingPosts,
} from '../controllers/post.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All routes below require a valid JWT token

// Create a post: POST /api/posts
router.post('/', requireAuth, createPost);

// Get single post: GET /api/posts/:id
router.get('/:id', requireAuth, getPost);

// Edit post: PUT /api/posts/:id
router.put('/:id', requireAuth, editPost);

// Delete post: DELETE /api/posts/:id
router.delete('/:id', requireAuth, deletePost);

// Like / Unlike: POST /api/posts/:id/like
router.post('/:id/like', requireAuth, toggleLike);

// Comment: POST /api/posts/:id/comment
router.post('/:id/comment', requireAuth, addComment);

// Trending posts: GET /api/posts/trending/all
router.get('/trending/all', requireAuth, getTrendingPosts);

export default router;