// server/controllers/group.controller.js
import { Group } from '../models/Group.js';

export async function createGroup(req, res, next) {
  try {
    const userId = req.user?.id; // set by authMiddleware
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const { name, description, isPublic } = req.body || {};

    if (!name) {
      return res.status(400).json({ ok: false, error: 'name is required' });
    }

    const group = await Group.create({
      name,
      description: description || '',
      isPublic: typeof isPublic === 'boolean' ? isPublic : true,
      createdBy: userId,
    });

    res.status(201).json({ ok: true, data: group });
  } catch (err) {
    next(err);
  }
}

export async function listGroups(req, res, next) {
  try {
    const groups = await Group.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ ok: true, data: groups });
  } catch (err) {
    next(err);
  }
}
