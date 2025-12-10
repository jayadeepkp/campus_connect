// server/controllers/directMessage.controller.js
import { DirectMessage, normalizeDirectMessage } from '../models/DirectMessage.js';
import { User } from '../models/User.js';

// Helper: send a consistent error response
function sendError(res, status, message) {
  return res.status(status).json({
    ok: false,
    error: message || 'Something went wrong',
  });
}

/**
 * POST /api/direct-messages/resolve-user
 * Body: { email: string }
 * Returns: { ok: true, data: { userId, email, name } } on success
 */
export async function resolveUserByEmail(req, res) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return sendError(res, 400, 'email is required');
    }

    const trimmed = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmed }).exec();
    if (!user) {
      return sendError(res, 404, 'No user found with that email');
    }

    // optionally, prevent chatting with yourself
    if (req.user && String(user._id) === String(req.user.id)) {
      return sendError(res, 400, 'You cannot open a chat with yourself');
    }

    return res.json({
      ok: true,
      data: {
        userId: String(user._id),
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('resolveUserByEmail error:', err);
    return sendError(res, 500, 'Failed to resolve user by email');
  }
}

/**
 * POST /api/direct-messages/send
 * Body: { otherUserId: string, content: string }
 * Returns: { ok: true, data: savedMessage }
 */
export async function sendDirectMessage(req, res) {
  try {
    const { otherUserId, content } = req.body || {};

    if (!otherUserId || typeof otherUserId !== 'string') {
      return sendError(res, 400, 'otherUserId is required');
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return sendError(res, 400, 'content is required');
    }

    const fromId = String(req.user.id);
    const toId = String(otherUserId);

    const msg = new DirectMessage({
      from: fromId,
      to: toId,
      content: content.trim(),   // IMPORTANT: uses `content` to match your model
    });

    const saved = await msg.save();
    const normalized = normalizeDirectMessage(saved);

    return res.json({
      ok: true,
      data: normalized,
    });
  } catch (err) {
    console.error('sendDirectMessage error:', err);
    return sendError(res, 500, 'Failed to send message');
  }
}

/**
 * POST /api/direct-messages/history
 * Body: { otherUserId: string }
 * Returns: { ok: true, data: messages[] } (sorted oldest → newest)
 */
export async function getThreadWithUser(req, res) {
  try {
    const { otherUserId } = req.body || {};

    if (!otherUserId || typeof otherUserId !== 'string') {
      return sendError(res, 400, 'otherUserId is required');
    }

    const me = String(req.user.id);
    const other = String(otherUserId);

    const messages = await DirectMessage.find({
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    })
      .sort({ createdAt: 1 })
      .exec();

    const normalized = messages.map(normalizeDirectMessage);

    return res.json({
      ok: true,
      data: normalized,
    });
  } catch (err) {
    console.error('getThreadWithUser error:', err);
    return sendError(res, 500, 'Failed to load conversation');
  }
}
