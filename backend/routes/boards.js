import express from "express";
import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
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

router.get("/:boardId/activity", requireBoardAccess, async (req, res) => {
  try {
    const boardId = req.board._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const total = await ActivityLog.countDocuments({ boardId });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const logs = await ActivityLog.find({ boardId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name")
      .lean();
    res.json({
      activities: logs.map((log) => ({
        id: log._id,
        userId: log.userId?._id,
        userName: log.userId?.name ?? "Unknown",
        action: log.action,
        timestamp: log.timestamp,
      })),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch activity", error: err.message });
  }
});

export default router;
