import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Board name is required"],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

boardSchema.index({ createdBy: 1 });

export const Board = mongoose.model("Board", boardSchema);
