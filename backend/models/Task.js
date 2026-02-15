import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

taskSchema.index({ listId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ listId: 1, order: 1 });

export const Task = mongoose.model("Task", taskSchema);
