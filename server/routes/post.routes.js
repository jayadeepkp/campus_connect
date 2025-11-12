import { Router } from 'express';
import { createPost, getPost, editPost, deletePost } from '../controllers/post.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/post', auth, createPost);
router.get('/post/:id', getPost);
router.patch('/post/:id', auth, editPost);
router.delete('/post/:id', auth, deletePost);

export default router;
