// server/models/DirectMessage.js
import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

function normalizeDirectMessage(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    _id: obj._id,
    from: obj.from,
    to: obj.to,
    content: obj.content,   // ← keep in sync
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);

export default DirectMessage;
export { DirectMessage, normalizeDirectMessage };
