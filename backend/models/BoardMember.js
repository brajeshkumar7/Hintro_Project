import mongoose from "mongoose";

const boardMemberSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

boardMemberSchema.index({ boardId: 1 });
boardMemberSchema.index({ userId: 1 });
boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });

export const BoardMember = mongoose.model("BoardMember", boardMemberSchema);
