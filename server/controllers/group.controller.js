// server/controllers/group.controller.js
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';

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
export async function listMyGroups(req, res, next) {
  try {
    const userId = req.user.id;

    const groups = await Group.find({ createdBy: userId })
      .sort({ createdAt: -1 });

    return res.json({ ok: true, data: groups });
  } catch (err) {
    next(err);
  }
}
export async function getGroupById(req, res, next) {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ ok: false, error: "Group not found" });
    }

    return res.json({ ok: true, data: group });
  } catch (err) {
    next(err);
  }
}
export async function deleteGroup(req, res, next) {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ ok: false, error: "Group not found" });
    }

    // Only the creator can delete their group
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ ok: false, error: "Not allowed" });
    }

    await group.deleteOne();

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
export async function addMemberByEmail(req, res, next) {
  try {
    const groupId = req.params.id;
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ ok: false, error: "Group not found" });
    }

    if (!group.members.includes(user._id)) {
      group.members.push(user._id);
      await group.save();
    }

    return res.json({ ok: true, data: group });
  } catch (err) {
    next(err);
  }
}