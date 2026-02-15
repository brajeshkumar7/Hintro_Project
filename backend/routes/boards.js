import express from "express";
import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { requireBoardAccess } from "../middleware/boardAccess.js";

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

router.get("/:boardId/members", requireBoardAccess, async (req, res) => {
  try {
    const boardId = req.board._id;
    const board = await Board.findById(boardId).lean();
    const memberEntries = await BoardMember.find({ boardId }).select("userId").lean();
    const userIds = [board.createdBy, ...memberEntries.map((m) => m.userId)];
    const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
    const users = await User.find({ _id: { $in: uniqueIds } })
      .select("_id name email")
      .lean();
    res.json({
      members: users.map((u) => ({ id: u._id, name: u.name, email: u.email })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch members", error: err.message });
  }
});

export default router;
