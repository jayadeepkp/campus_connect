import { Router } from "express";
import { toggleBlock } from "../controllers/user.controller.js"
import { requireAuth } from "../middleware/auth.js"

const router = Router();

// Block / unblock: POST /api/users/:id/block
router.post('/:id/block', requireAuth, toggleBlock);

export default router;
