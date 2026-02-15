import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
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
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ boardId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ boardId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
