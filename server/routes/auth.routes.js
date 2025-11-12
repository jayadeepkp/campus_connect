import { Router } from 'express';
import {
  register,
  login,
  requestPasswordReset,
  resetPasswordWithCode
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot', requestPasswordReset);          // sends 6-digit code
router.post('/reset-with-code', resetPasswordWithCode); // verify code + reset

export default router;