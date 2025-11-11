import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { User } from '../models/User.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

function sign(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '7d'
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ ok: false, error: 'name, email, password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ ok: false, error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = sign(user);
    res.status(201).json({
      ok: true,
      data: { token, user: { id: user._id, name: user.name, email: user.email } }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const token = sign(user);
    res.json({ ok: true, data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (err) {
    next(err);
  }
}

/**
 * Request a password reset:
 * - Generates a token and expiry.
 * - (Prototype) Returns token in response and logs it. In production, email it.
 */
export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });

    const user = await User.findOne({ email });
    // To avoid user enumeration, respond success even if not found.
    if (!user) {
      return res.json({ ok: true, message: 'If that email exists, a reset token was created.' });
    }

    const ttlMin = parseInt(process.env.RESET_TOKEN_TTL_MIN || '30', 10);
    const token = nanoid();
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    console.log('🔐 Password reset token for', user.email, ':', token, '(expires at', expiresAt.toISOString(), ')');

    // Prototype: return the token so you can test easily
    res.json({
      ok: true,
      message: `Reset token created. Valid for ${ttlMin} minutes.`,
      data: { token } // REMOVE in production
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, error: 'token and newPassword required' });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid token' });

    if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      return res.status(400).json({ ok: false, error: 'Token expired' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    res.json({ ok: true, message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
}