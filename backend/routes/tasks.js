import express from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { List } from "../models/List.js";
import { protect } from "../middleware/auth.js";
import { getBoardIfAllowed, getListAndBoardIfAllowed } from "../middleware/boardAccess.js";

const router = express.Router();

router.use(protect);

async function getTaskAndAssertAccess(req, res) {
  const taskId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    res.status(400).json({ message: "Invalid task ID" });
    return null;
  }
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return null;
  }
  const result = await getListAndBoardIfAllowed(req.user._id, task.listId);
  if (result.err) {
    res.status(result.err).json({ message: result.message });
    return null;
  }
  return { task, list: result.list, board: result.board };
}

router.post("/", async (req, res) => {
  try {
    const { listId, title, description, assignedTo, order } = req.body;
    if (!listId) {
      return res.status(400).json({ message: "List ID is required" });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    const result = await getListAndBoardIfAllowed(req.user._id, listId);
    if (result.err) {
      return res.status(result.err).json({ message: result.message });
    }
    const maxOrder = await Task.findOne({ listId }).sort({ order: -1 }).select("order").lean();
    const nextOrder = typeof order === "number" ? order : (maxOrder?.order ?? -1) + 1;
    const task = await Task.create({
      listId,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      assignedTo: assignedTo || null,
      order: nextOrder,
    });
    res.status(201).json({
      message: "Task created",
      task: {
        id: task._id,
        listId: task.listId,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        order: task.order,
        createdAt: task.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const boardId = req.query.boardId;
    const listId = req.query.listId;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    if (!boardId) {
      return res.status(400).json({ message: "Query boardId is required" });
    }
    const access = await getBoardIfAllowed(req.user._id, boardId);
    if (access.err) {
      return res.status(access.err).json({ message: access.message });
    }

    const listFilter = { boardId };
    if (listId) listFilter._id = listId;
    const listIds = await List.find(listFilter).select("_id").lean();
    const ids = listIds.map((l) => l._id);
    if (ids.length === 0) {
      return res.json({ tasks: [], total: 0, page, limit, totalPages: 0 });
    }

    const query = { listId: { $in: ids } };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const tasks = await Task.find(query).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit).lean();

    res.json({
      tasks: tasks.map((t) => ({
        id: t._id,
        listId: t.listId,
        title: t.title,
        description: t.description,
        assignedTo: t.assignedTo,
        order: t.order,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks", error: err.message });
  }
});

router.put("/:id/move", async (req, res) => {
  const payload = await getTaskAndAssertAccess(req, res);
  if (!payload) return;
  const { task, board } = payload;
  const { listId, order } = req.body;
  if (!listId) {
    return res.status(400).json({ message: "listId is required to move task" });
  }
  const targetResult = await getListAndBoardIfAllowed(req.user._id, listId);
  if (targetResult.err) {
    return res.status(targetResult.err).json({ message: targetResult.message });
  }
  if (targetResult.board._id.toString() !== board._id.toString()) {
    return res.status(400).json({ message: "Cannot move task to a list on another board" });
  }
  try {
    const newOrder = typeof order === "number" ? order : task.order;
    const updated = await Task.findByIdAndUpdate(
      task._id,
      { $set: { listId, order: newOrder } },
      { new: true, runValidators: true }
    ).lean();
    res.json({
      message: "Task moved",
      task: {
        id: updated._id,
        listId: updated.listId,
        title: updated.title,
        description: updated.description,
        assignedTo: updated.assignedTo,
        order: updated.order,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to move task", error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const payload = await getTaskAndAssertAccess(req, res);
  if (!payload) return;
  const { task } = payload;
  try {
    const { title, description, assignedTo, order } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = typeof title === "string" ? title.trim() : task.title;
    if (description !== undefined) updates.description = typeof description === "string" ? description : task.description;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null;
    if (typeof order === "number") updates.order = order;

    const updated = await Task.findByIdAndUpdate(
      task._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    res.json({
      message: "Task updated",
      task: {
        id: updated._id,
        listId: updated.listId,
        title: updated.title,
        description: updated.description,
        assignedTo: updated.assignedTo,
        order: updated.order,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const payload = await getTaskAndAssertAccess(req, res);
  if (!payload) return;
  try {
    await Task.findByIdAndDelete(payload.task._id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task", error: err.message });
  }
});

export default router;
