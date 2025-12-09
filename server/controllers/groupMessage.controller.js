// server/controllers/groupMessage.controller.js
import { Group } from '../models/Group.js';
import { GroupMessage } from '../models/GroupMessage.js';

function ensureMember(group, userId) {
  return (
    group.createdBy.toString() === userId ||
    group.members.some((m) => m.toString() === userId)
  );
}

export async function listGroupMessages(req, res, next) {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    if (!ensureMember(group, userId)) {
      return res
        .status(403)
        .json({ ok: false, error: 'You are not a member of this group' });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .lean();

    res.json({ ok: true, data: messages });
  } catch (err) {
    next(err);
  }
}

export async function createGroupMessage(req, res, next) {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { text } = req.body || {};

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'text is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    if (!ensureMember(group, userId)) {
      return res
        .status(403)
        .json({ ok: false, error: 'You are not a member of this group' });
    }

    const msg = await GroupMessage.create({
      group: groupId,
      sender: userId,
      text: text.trim(),
    });

    const populated = await GroupMessage.findById(msg._id)
      .populate('sender', 'name email')
      .lean();

    res.status(201).json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
}
