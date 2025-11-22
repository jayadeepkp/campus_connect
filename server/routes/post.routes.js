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

const router = Router();

// Create a post: POST /api/posts
router.post('/', createPost);

// Get single post: GET /api/posts/:id
router.get('/:id', getPost);

// Edit post: PUT /api/posts/:id
router.put('/:id', editPost);

// Delete post: DELETE /api/posts/:id
router.delete('/:id', deletePost);

// Like / Unlike: POST /api/posts/:id/like
router.post('/:id/like', toggleLike);

// Comment: POST /api/posts/:id/comment
router.post('/:id/comment', addComment);

// Trending: GET /api/posts/trending
router.get('/trending/all', getTrendingPosts);

export default router;