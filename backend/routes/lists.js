import express from "express";
import { List } from "../models/List.js";
import { protect } from "../middleware/auth.js";
import { requireBoardAccess } from "../middleware/boardAccess.js";

const router = express.Router();

router.use(protect);

router.post("/", requireBoardAccess, async (req, res) => {
  try {
    const { boardId, title, order } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "List title is required" });
    }
    const maxOrder = await List.findOne({ boardId }).sort({ order: -1 }).select("order").lean();
    const nextOrder = typeof order === "number" ? order : (maxOrder?.order ?? -1) + 1;
    const list = await List.create({
      boardId,
      title: title.trim(),
      order: nextOrder,
    });
    res.status(201).json({
      message: "List created",
      list: {
        id: list._id,
        boardId: list.boardId,
        title: list.title,
        order: list.order,
        createdAt: list.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create list", error: err.message });
  }
});

router.get("/:boardId", requireBoardAccess, async (req, res) => {
  try {
    const lists = await List.find({ boardId: req.board._id })
      .sort({ order: 1 })
      .lean();
    res.json({
      lists: lists.map((l) => ({
        id: l._id,
        boardId: l.boardId,
        title: l.title,
        order: l.order,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lists", error: err.message });
  }
});

export default router;
