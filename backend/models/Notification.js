import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, trim: true, default: "task_assigned" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    taskTitle: { type: String, required: true, trim: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromUserName: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
