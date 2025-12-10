// server/controllers/user.controller.js
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';

/**
 * GET /api/users/me
 * Return current user's profile + simple stats
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const myPosts = await Post.find({ author: userId }, 'likes comments').lean();
    const postsCount = myPosts.length;

    let likesReceivedCount = 0;
    let commentsReceivedCount = 0;
    for (const p of myPosts) {
      likesReceivedCount += Array.isArray(p.likes) ? p.likes.length : 0;
      commentsReceivedCount += Array.isArray(p.comments) ? p.comments.length : 0;
    }

    const likesGivenCount = await Post.countDocuments({ likes: userId });

    const profile = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,

      major: user.major || '',
      department: user.department || '',
      year: user.year || '',
      bio: user.bio || '',
      interests: Array.isArray(user.interests) ? user.interests : [],

      notificationSettings: user.notificationSettings || {
        likes: true,
        comments: true,
        replies: true,
        system: true,
      },

      postsCount,
      likesGivenCount,
      likesReceivedCount,
      commentsReceivedCount,
    };

    return res.json({ ok: true, data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/me/profile
 * Update rich profile fields (major, dept, year, bio, interests)
 */
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      major,
      department,
      year,
      bio,
      interests,
    } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    if (typeof major === 'string') user.major = major.trim();
    if (typeof department === 'string') user.department = department.trim();
    if (typeof year === 'string') user.year = year.trim();
    if (typeof bio === 'string') user.bio = bio.trim();

    if (Array.isArray(interests)) {
      user.interests = interests
        .map(s => String(s).trim())
        .filter(Boolean);
    } else if (typeof interests === 'string') {
      user.interests = interests
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    await user.save();

    const profile = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      major: user.major || '',
      department: user.department || '',
      year: user.year || '',
      bio: user.bio || '',
      interests: Array.isArray(user.interests) ? user.interests : [],
      notificationSettings: user.notificationSettings || {
        likes: true,
        comments: true,
        replies: true,
        system: true,
      },
    };

    return res.json({ ok: true, data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/settings
 * Basic account + settings info for Settings page
 */
export async function getSettings(req, res, next) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    return res.json({
      ok: true,
      data: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        notificationSettings: user.notificationSettings || {
          likes: true,
          comments: true,
          replies: true,
          system: true,
        },
        createdAt: user.createdAt,
        isDeleted: !!user.isDeleted,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/settings/account
 * Update basic account data (name) + notification preferences
 */
export async function updateSettings(req, res, next) {
  try {
    const userId = req.user._id;
    const { name, notificationSettings } = req.body || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (notificationSettings && typeof notificationSettings === 'object') {
      user.notificationSettings = {
        likes: notificationSettings.likes ?? user.notificationSettings.likes ?? true,
        comments: notificationSettings.comments ?? user.notificationSettings.comments ?? true,
        replies: notificationSettings.replies ?? user.notificationSettings.replies ?? true,
        system: notificationSettings.system ?? user.notificationSettings.system ?? true,
      };
    }

    await user.save();

    return res.json({
      ok: true,
      data: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        notificationSettings: user.notificationSettings,
        createdAt: user.createdAt,
        isDeleted: !!user.isDeleted,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users/settings/password
 * Change password using currentPassword + newPassword
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ ok: false, error: 'currentPassword and newPassword are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ ok: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/blocked
 * List users I have blocked
 */
export async function getBlockedUsers(req, res, next) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('blockedUsers', 'name email major department year').lean();

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const blockedUsers = Array.isArray(user.blockedUsers)
      ? user.blockedUsers.map(u => ({
          id: String(u._id),
          name: u.name,
          email: u.email,
          major: u.major || '',
          department: u.department || '',
          year: u.year || '',
        }))
      : [];

    return res.json({ ok: true, data: blockedUsers });
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfile(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "name email major department year bio interests createdAt"
    );

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Do NOT return passwords or settings
    return res.json({
      ok: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        major: user.major,
        department: user.department,
        year: user.year,
        bio: user.bio,
        interests: user.interests,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/discover
 * Find similar people: same major/department + overlapping interests.
 */
// server/controllers/user.controller.js

export async function discoverPeople(req, res, next) {
  try {
    const meId = req.user._id;
    const q = String(req.query.q || "").trim().toLowerCase();

    // Get current user (for major, interests, etc.)
    const me = await User.findById(meId).lean();
    if (!me) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const blockedIds = me.blockedUsers || [];

    // Base query: not me, not deleted, not blocked
    const baseQuery = {
      _id: { $ne: meId, $nin: blockedIds },
      isDeleted: { $ne: true },
    };

    const candidates = await User.find(baseQuery).lean();

    const scored = candidates.map((u) => {
      let score = 0;

      // ---------- similarity score ----------
      // Same major
      if (u.major && me.major && u.major === me.major) {
        score += 3;
      }

      // Same department
      if (u.department && me.department && u.department === me.department) {
        score += 2;
      }

      // Same year (Freshman, Sophomore, etc.)
      if (u.year && me.year && u.year === me.year) {
        score += 1;
      }

      // Overlapping interests
      if (Array.isArray(me.interests) && Array.isArray(u.interests)) {
        const overlap = u.interests.filter((interest) =>
          me.interests.includes(interest)
        ).length;
        score += overlap * 2; // each shared interest gives +2
      }

      // ---------- search matching ----------
      let matchesSearch = !q; // if no q, we consider everyone and then filter by score

      const lowerName = String(u.name || "").toLowerCase();
      const lowerEmail = String(u.email || "").toLowerCase();
      const lowerMajor = String(u.major || "").toLowerCase();
      const lowerDept = String(u.department || "").toLowerCase();
      const lowerYear = String(u.year || "").toLowerCase();
      const lowerBio = String(u.bio || "").toLowerCase();
      const interestsStr = Array.isArray(u.interests)
        ? u.interests.join(" ").toLowerCase()
        : "";

      if (
        q &&
        (
          lowerName.includes(q) ||          // search by name
          lowerEmail.includes(q) ||         // search by email
          lowerMajor.includes(q) ||         // search by major
          lowerDept.includes(q) ||          // search by department
          lowerYear.includes(q) ||          // search by year
          lowerBio.includes(q) ||           // search by bio
          interestsStr.includes(q)          // search by interest keyword
        )
      ) {
        matchesSearch = true;
        score += 5; // boost for matching the search term
      }

      return { user: u, score, matchesSearch };
    });

    const filtered = scored
      // keep only people that match the search (or everybody if no q)
      .filter((x) => x.matchesSearch)
      // if there's no q, require at least some similarity score
      .filter((x) => q ? true : x.score > 0);

    // Sort best → worst based on score
    filtered.sort((a, b) => b.score - a.score);

    return res.json({
      ok: true,
      data: filtered.map(({ user, score }) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        major: user.major || "",
        department: user.department || "",
        year: user.year || "",
        bio: user.bio || "",
        interests: user.interests || [],
        score,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Block / unblock a user
 * POST /api/users/:id/block
 */
export async function toggleBlock(req, res, next) {
  try {
    const blockingUserId = req.user.id;
    const blockingUser = await User.findById(blockingUserId);
    const blockedUserId = req.params.id;

    if (String(blockingUserId) === String(blockedUserId))
      return res.status(400).json({
        ok: false,
        error: "A user may not block themself",
      });

    const blockedUser = await User.findById(blockedUserId);
    if (!blockedUser)
      return res.status(404).json({ ok: false, error: "user does not exist" });

    if (!Array.isArray(blockingUser.blockedUsers))
      blockingUser.blockedUsers = [];

    const alreadyIndex = blockingUser.blockedUsers.findIndex(
      (id) => String(id) === String(blockedUserId)
    );

    let blocked;
    if (alreadyIndex === -1) {
      blockingUser.blockedUsers.push(blockedUserId);
      blocked = true;
    } else {
      blockingUser.blockedUsers.splice(alreadyIndex, 1);
      blocked = false;
    }

    await blockingUser.save();

    return res.json({
      ok: true,
      data: {
        blocked,
        blockedUserId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * Soft delete account (isDeleted = true)
 */
export async function deleteAccount(req, res, next) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    user.isDeleted = true;
    await user.save();

    // You can also later add cleanup: remove tokens, anonymize posts, etc.
    return res.json({ ok: true, message: 'Account has been deactivated.' });
  } catch (err) {
    next(err);
  }
}