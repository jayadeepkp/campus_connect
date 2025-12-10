// server/routes/directMessage.routes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  resolveUserByEmail,
  sendDirectMessage,
  getThreadWithUser,
} from '../controllers/directMessage.controller.js';

const router = Router();

// Resolve a classmate by email to their MongoDB _id
router.post('/resolve-user', requireAuth, resolveUserByEmail);

// Send a direct message to another user by id
router.post('/send', requireAuth, sendDirectMessage);

// Get message history between the logged-in user and another user id
router.post('/history', requireAuth, getThreadWithUser);

export default router;
