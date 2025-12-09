// server/controllers/group.controller.js
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';

function normalizeGroup(g) {
  return {
    ...g,
    members: g.members ?? [],
  };
}

// CREATE group – creator becomes member
export async function createGroup(req, res, next) {
  try {
    const userId = req.user?.id;
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
      members: [userId],
    });

    const plain = group.toObject();
    return res.status(201).json({
      ok: true,
      data: normalizeGroup(plain),
    });
  } catch (err) {
    next(err);
  }
}

// PUBLIC groups (not used yet in UI, but fine to keep)
export async function listGroups(req, res, next) {
  try {
    const groups = await Group.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const normalized = groups.map(normalizeGroup);

    res.json({ ok: true, data: normalized });
  } catch (err) {
    next(err);
  }
}

// ONLY groups I CREATED – used for "Your groups"
export async function listMyGroups(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const groups = await Group.find({
      $or: [{ createdBy: userId }, { members: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const normalized = groups.map(normalizeGroup);

    res.json({ ok: true, data: normalized });
  } catch (err) {
    next(err);
  }
}

// ONLY creator can delete
export async function deleteGroup(req, res, next) {
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

    if (group.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: 'Not allowed to delete this group' });
    }

    await group.deleteOne();

    res.json({ ok: true, data: { id: groupId } });
  } catch (err) {
    next(err);
  }
}

// details + members for one group
export async function getGroupById(req, res, next) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .lean();

    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    res.json({ ok: true, data: normalizeGroup(group) });
  } catch (err) {
    next(err);
  }
}

// creator can add members by email
export async function addMemberByEmail(req, res, next) {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { email } = req.body || {};

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    if (!email) {
      return res.status(400).json({ ok: false, error: 'email is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ ok: false, error: 'Group not found' });
    }

    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'Only the group creator can add members',
      });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res
        .status(404)
        .json({ ok: false, error: 'User with that email not found' });
    }

    const alreadyMember = group.members.some(
      (m) => m.toString() === userToAdd._id.toString(),
    );
    if (!alreadyMember) {
      group.members.push(userToAdd._id);
      await group.save();
    }

    const populated = await Group.findById(groupId)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .lean();

    res.json({
      ok: true,
      data: normalizeGroup(populated),
    });
  } catch (err) {
    next(err);
  }
}
