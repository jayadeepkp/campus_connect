import express from 'express';
import { createGroup, listGroups } from '../controllers/group.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/groups - list public groups
router.get('/', listGroups);

// POST /api/groups - create a new group (must be logged in)
router.post('/', authMiddleware, createGroup);

export default router;
