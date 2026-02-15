import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    title: {
      type: String,
      required: [true, "List title is required"],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

listSchema.index({ boardId: 1 });
listSchema.index({ boardId: 1, order: 1 });

export const List = mongoose.model("List", listSchema);
