import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      minLength: [1, "Post cannot be empty"]
    },
    poster: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true
    },
    edited: Boolean
  },
  { timestamps: true }
);

export const Post =  mongoose.model("Post", PostSchema);
