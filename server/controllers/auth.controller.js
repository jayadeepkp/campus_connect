import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import { User } from '../models/User.js';
import { sendEmail } from '../utils/mailer.js';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

// ---------- org allow-list helpers (keep if you added restriction) ----------
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
  if (domains.length === 0) return true;
  return domains.includes(emailDomain(email));
}
// ---------------------------------------------------------------------------

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

/**
 * Request a password reset via 6-digit code (OTP).
 * - Generates code, hashes it, sets expiry.
 * - Sends code by email (and logs it for dev).
 */
export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });

    if (!isAllowedEmail(email)) {
      return res.status(403).json({
        ok: false,
        error: `Password recovery is restricted to: ${getAllowedDomains().join(', ')}`
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    // respond success regardless to avoid enumeration
    if (!user) {
      return res.json({ ok: true, message: 'If that email exists, a reset code was sent.' });
    }

    const ttlMin = parseInt(process.env.RESET_TOKEN_TTL_MIN || '30', 10);
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const codeHash = await bcrypt.hash(code, 10);

    user.resetCodeHash = codeHash;
    user.resetCodeExpiresAt = new Date(Date.now() + ttlMin * 60 * 1000);
    // still keep token fields null if you want to separate mechanisms
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await user.save();

    // send email (and also log for dev)
    const subject = 'Your Campus Connect reset code';
    const text = `Your password reset code is ${code}. It expires in ${ttlMin} minutes.`;
    const html = `<p>Your password reset code is <b>${code}</b>.</p><p>It expires in ${ttlMin} minutes.</p>`;
    try {
      await sendEmail({ to: user.email, subject, text, html });
    } catch (e) {
      console.warn('⚠️ Email send failed; code logged below (dev mode).', e.message);
    }
    console.log('🔐 Password reset code for', user.email, ':', code, '(expires in', ttlMin, 'min)');

    res.json({
      ok: true,
      message: `If that email exists, a reset code was sent.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password using { email, code, newPassword }.
 */
export async function resetPasswordWithCode(req, res, next) {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ ok: false, error: 'email, code, newPassword required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !user.resetCodeHash) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired code' });
    }

    if (!user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date()) {
      return res.status(400).json({ ok: false, error: 'Code expired' });
    }

    const ok = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!ok) return res.status(400).json({ ok: false, error: 'Invalid code' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetCodeHash = null;
    user.resetCodeExpiresAt = null;
    await user.save();

    res.json({ ok: true, message: 'Password updated. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
}