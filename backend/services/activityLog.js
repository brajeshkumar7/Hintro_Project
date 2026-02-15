import { ActivityLog } from "../models/ActivityLog.js";

const ACTION_TO_EVENT = {
  task_created: "task:created",
  task_updated: "task:updated",
  task_deleted: "task:deleted",
  task_moved: "task:moved",
};

function getRoom(boardId) {
  return "board:" + boardId;
}

export async function logActivity(io, options) {
  const { boardId, userId, userName, action, task, listId, fromListId } = options;
  if (!io || !boardId || !userId || !action) return;

  const timestamp = new Date();
  await ActivityLog.create({
    boardId,
    userId,
    action,
    timestamp,
  });

  const eventName = ACTION_TO_EVENT[action];
  if (!eventName) return;

  const payload = {
    action,
    userId: userId.toString(),
    userName: userName || "",
    timestamp: timestamp.toISOString(),
    task: task || null,
    listId: listId ? listId.toString() : undefined,
    fromListId: fromListId ? fromListId.toString() : undefined,
  };

  io.to(getRoom(boardId)).emit(eventName, payload);
}
