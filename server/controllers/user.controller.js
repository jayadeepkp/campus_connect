import { User } from '../models/User.js';

/**
 * Block / unblock a user
 * Params: :id
 */
export async function toggleBlock(req, res, next) {
  try {
    const blockingUserId = req.user.id;
    const blockingUser = await User.findById(blockingUserId);
    
    const blockedUserId = req.params.id;

    if (String(blockingUserId) === String(blockedUserId))
      return res.status(400).json({
        ok: false,
        error: "A user may not block themself"
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
        blockedUserId
      }
    });
  } catch (err) {
    next(err);
  }
}

