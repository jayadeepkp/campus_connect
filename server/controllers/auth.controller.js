import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { User } from '../models/User.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

// ---------- org allow-list helpers ----------
function getAllowedDomains() {
  const raw = (process.env.ALLOWED_EMAIL_DOMAINS || '').trim();
  return raw
    ? raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
}
function emailDomain(email) {
  return String(email || '').toLowerCase().split('@')[1] || '';
}
function isAllowedEmail(email) {
  const domains = getAllowedDomains();
  if (domains.length === 0) return true; // no restriction configured
  return domains.includes(emailDomain(email));
}
// -------------------------------------------

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

    // ✅ Enforce org allow-list at registration time
    if (!isAllowedEmail(email)) {
      return res.status(403).json({
        ok: false,
        error: `Registration is restricted to: ${getAllowedDomains().join(', ')}`
      });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ ok: false, error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: String(email).toLowerCase(), passwordHash });
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

    // Optional: also block login for non-allowed domains
    if (!isAllowedEmail(email)) {
      return res.status(403).json({
        ok: false,
        error: `Login is restricted to: ${getAllowedDomains().join(', ')}`
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const token = sign(user);
    res.json({ ok: true, data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });

    // Optional: enforce domain on recovery entry point too
    if (!isAllowedEmail(email)) {
      return res.status(403).json({
        ok: false,
        error: `Password recovery is restricted to: ${getAllowedDomains().join(', ')}`
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    // Do not reveal existence
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

    res.json({
      ok: true,
      message: `Reset token created. Valid for ${ttlMin} minutes.`,
      data: { token } // prototype: returned for testing
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