import express from 'express';
import { createGroup, listGroups } from '../controllers/group.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { listMyGroups } from '../controllers/group.controller.js';
import { getGroupById } from '../controllers/group.controller.js';
import { deleteGroup } from '../controllers/group.controller.js';
import { addMemberByEmail } from '../controllers/group.controller.js';

const router = express.Router();

// GET /api/groups - list public groups
router.get('/', listGroups);

// POST /api/groups - create a new group (must be logged in)
router.post('/', authMiddleware, createGroup);
router.get('/mine', authMiddleware, listMyGroups);
router.get('/:id', authMiddleware, getGroupById);
router.delete('/:id', authMiddleware, deleteGroup);
router.post('/:id/members', authMiddleware, addMemberByEmail);

export default router;
