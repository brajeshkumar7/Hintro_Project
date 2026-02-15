import { Board } from "../models/Board.js";
import { BoardMember } from "../models/BoardMember.js";
import { List } from "../models/List.js";

export async function getBoardIfAllowed(userId, boardId) {
  const board = await Board.findById(boardId);
  if (!board) return { err: 404, message: "Board not found" };
  if (board.createdBy.toString() === userId.toString()) return { board };
  const member = await BoardMember.findOne({ boardId, userId });
  if (member) return { board };
  return { err: 403, message: "Access denied to this board" };
}

export async function getListAndBoardIfAllowed(userId, listId) {
  const list = await List.findById(listId);
  if (!list) return { err: 404, message: "List not found" };
  const result = await getBoardIfAllowed(userId, list.boardId);
  if (result.err) return result;
  return { list, board: result.board };
}

export async function requireBoardAccess(req, res, next) {
  const boardId = req.params.boardId || req.body.boardId;
  if (!boardId) {
    return res.status(400).json({ message: "Board ID is required" });
  }
  const result = await getBoardIfAllowed(req.user._id, boardId);
  if (result.err) {
    return res.status(result.err).json({ message: result.message });
  }
  req.board = result.board;
  next();
}
