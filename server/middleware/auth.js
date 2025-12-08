// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// This middleware checks the Authorization: Bearer <token> header
// and attaches the authenticated user to req.user
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res
        .status(401)
        .json({ ok: false, error: 'Missing or invalid Authorization header' });
    }

    // Decode token using the same secret used in auth routes
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.id);
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, error: 'User not found for this token' });
    }

    // Attach user to request so controllers can trust req.user
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res
      .status(401)
      .json({ ok: false, error: 'Invalid or expired token' });
  }
}

// Alias so other files can import { authMiddleware } from '../middleware/auth.js'
export { requireAuth as authMiddleware };