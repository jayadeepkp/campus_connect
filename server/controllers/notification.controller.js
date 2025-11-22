// server/controllers/notification.controller.js
import { Notification } from "../models/Notification.js";

/**
 * Get my notifications
 * GET /api/notifications
 */
export async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, data: notifications });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark one notification as read
 * POST /api/notifications/:id/read
 */
export async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ ok: false, error: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    return res.json({ ok: true, data: notification });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark all as read
 * POST /api/notifications/read-all
 */
export async function markAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    return res.json({ ok: true, data: 'ok' });
  } catch (err) {
    next(err);
  }
}