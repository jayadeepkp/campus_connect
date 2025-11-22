import { Router } from "express";
import { toggleBlock } from "../controllers/user.controller.js"
import { auth } from "../middleware/auth.js"

const router = Router();

// Block / unblock: POST /api/users/:id/block
router.post('/:id/block', auth, toggleBlock);

export default router;
