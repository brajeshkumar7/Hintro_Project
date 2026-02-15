import express from "express";
import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Board name is required" });
    }
    const board = await Board.create({
      name: name.trim(),
      createdBy: req.user._id,
    });
    await BoardMember.create({ boardId: board._id, userId: req.user._id });
    res.status(201).json({
      message: "Board created",
      board: {
        id: board._id,
        name: board.name,
        createdBy: board.createdBy,
        createdAt: board.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to create board", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const memberEntries = await BoardMember.find({ userId }).select("boardId");
    const memberBoardIds = memberEntries.map((e) => e.boardId);
    const boards = await Board.find({
      $or: [{ createdBy: userId }, { _id: { $in: memberBoardIds } }],
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      boards: boards.map((b) => ({
        id: b._id,
        name: b.name,
        createdBy: b.createdBy,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch boards", error: err.message });
  }
});

export default router;
