import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },

    // Token-based reset (kept in case you want both)
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },

    // NEW: Code (OTP) based reset
    resetCodeHash: { type: String, default: null },
    resetCodeExpiresAt: { type: Date, default: null },

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
