import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "./models/User.js";
import { getBoardIfAllowed } from "./middleware/boardAccess.js";

const EVENT_JOIN_BOARD = "join_board";
const EVENT_LEAVE_BOARD = "leave_board";
const ROOM_PREFIX = "board:";

function getTokenFromHandshake(handshake) {
  const auth = handshake.auth;
  if (auth?.token) return auth.token;
  const query = handshake.query;
  if (query?.token) return query.token;
  return null;
}

function getAllowedOrigins() {
  if (process.env.NODE_ENV !== "production") {
    return ["http://localhost:5173"];
  }
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return true;
}

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = getTokenFromHandshake(socket.handshake);
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.userId) {
        return next(new Error("Invalid token"));
      }
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return next(new Error("User not found"));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userRoom = "user:" + socket.user._id;
    socket.join(userRoom);

    socket.on(EVENT_JOIN_BOARD, async (boardId, callback) => {
      if (!boardId) {
        if (typeof callback === "function") callback({ ok: false, message: "Board ID is required" });
        return;
      }
      const result = await getBoardIfAllowed(socket.user._id, boardId);
      if (result.err) {
        if (typeof callback === "function") callback({ ok: false, message: result.message });
        return;
      }
      const room = ROOM_PREFIX + boardId;
      await socket.join(room);
      if (typeof callback === "function") callback({ ok: true, room });
    });

    socket.on(EVENT_LEAVE_BOARD, (boardId) => {
      if (boardId) {
        socket.leave(ROOM_PREFIX + boardId);
      }
    });

    socket.on("disconnect", () => { });
  });

  return io;
}
