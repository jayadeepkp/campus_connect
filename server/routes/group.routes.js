// server/routes/group.routes.js
import express from 'express';
import {
  createGroup,
  listGroups,
  listMyGroups,
  deleteGroup,
  getGroupById,
  addMemberByEmail,
} from '../controllers/group.controller.js';
import {
  listGroupMessages,
  createGroupMessage,
} from '../controllers/groupMessage.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public list (not used yet in UI, but fine to keep)
router.get('/', listGroups);

// My own groups – used for "Your groups"
router.get('/mine', authMiddleware, listMyGroups);

// Group details
router.get('/:groupId', authMiddleware, getGroupById);

// Add member by email (only creator)
router.post('/:groupId/members', authMiddleware, addMemberByEmail);

// Group chat
router.get('/:groupId/messages', authMiddleware, listGroupMessages);
router.post('/:groupId/messages', authMiddleware, createGroupMessage);

// Create + delete
router.post('/', authMiddleware, createGroup);
router.delete('/:groupId', authMiddleware, deleteGroup);

export default router;
