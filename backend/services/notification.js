import { Notification } from "../models/Notification.js";

const USER_ROOM_PREFIX = "user:";

function getUserRoom(userId) {
  return USER_ROOM_PREFIX + userId;
}

/**
 * Create a task_assigned notification and emit to the assignee's socket room.
 * @param {object} io - Socket.io server instance
 * @param {object} options - { assigneeId, taskId, taskTitle, boardId, boardName?, fromUserId, fromUserName }
 */
export async function notifyTaskAssigned(io, options) {
  const { assigneeId, taskId, taskTitle, boardId, boardName, fromUserId, fromUserName } = options;
  if (!io || !assigneeId || !taskId || !taskTitle || !boardId || !fromUserId || !fromUserName) return;

  const assigneeIdStr = assigneeId.toString();
  const fromUserIdStr = fromUserId.toString();
  if (assigneeIdStr === fromUserIdStr) return;

  await Notification.create({
    userId: assigneeId,
    type: "task_assigned",
    taskId,
    boardId,
    taskTitle: String(taskTitle).trim() || "Untitled task",
    fromUserId,
    fromUserName: String(fromUserName).trim(),
    read: false,
  });

  const payload = {
    type: "task_assigned",
    taskId: taskId.toString(),
    taskTitle: String(taskTitle).trim() || "Untitled task",
    boardId: boardId.toString(),
    boardName: boardName || "",
    fromUserId: fromUserIdStr,
    fromUserName: String(fromUserName).trim(),
  };

  io.to(getUserRoom(assigneeId)).emit("task_assigned", payload);
}
