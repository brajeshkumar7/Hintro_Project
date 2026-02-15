# Backend Architecture

This document describes the Node.js/Express backend structure, REST API design, authentication, WebSocket integration, and use of MongoDB.

---

## Express App Structure

- **`app.js`**: Constructs the Express application only. It applies CORS and JSON body parsing, mounts the health route and the API routers (`/api/auth`, `/api/boards`, `/api/lists`, `/api/tasks`, **`/api/users`**), and registers a global error handler that returns 500 with a generic message. It does not connect to the database or start the HTTP server. It is exported for use by `server.js` and by tests.
- **`server.js`**: Loads environment variables, imports `app`, creates an HTTP server from it, attaches the Socket.io server via `setupSocket(httpServer)`, sets `app.set("io", io)` so routes can access the Socket.io instance, connects to MongoDB via `connectDB()`, and starts listening on `PORT`. All startup and IO attachment happen here so that the Express app itself remains testable without a live DB or socket server.

Route modules live under `routes/` and are mounted on path prefixes in `app.js`. Middleware (auth, board access) is applied at router or route level. Shared logic for board/list access lives in `middleware/boardAccess.js`; activity logging and emission are in `services/activityLog.js`; **assignment notifications** (create Notification + emit to user room) are in **`services/notification.js`**.

---

## REST API Design

- **Base path**: All API routes are under `/api` (e.g. `/api/auth`, `/api/boards`, `/api/lists`, `/api/tasks`). The only non-API route is `GET /health`.
- **Conventions**: 
  - JSON request/response; IDs in responses are string (MongoDB ObjectId). 
  - Errors return a JSON object with a `message` (and optionally `error`) and an appropriate HTTP status (4xx/5xx).
  - Protected routes require `Authorization: Bearer <JWT>` and return 401 when missing or invalid.
- **Board-scoped access**: Boards, lists, and tasks are scoped by board. A user can access a board if they are the creator or a board member. The `requireBoardAccess` middleware (and helpers like `getBoardIfAllowed`, `getListAndBoardIfAllowed`) enforce this before performing list/task operations. Task routes resolve the board via the task’s list and validate that the current user has access to that board.

See `docs/api-contract.md` for the full list of endpoints and request/response shapes.

---

## Authentication Flow

- **Signup**: `POST /api/auth/signup` with `name`, `email`, `password`. Passwords are hashed with bcrypt (in the User model pre-save hook). The API creates the user, signs a JWT with `userId` and `JWT_SECRET`, and returns the token plus user payload (`id`, `name`, `email`). No session is stored on the server.
- **Login**: `POST /api/auth/login` with `email`, `password`. The API finds the user (with `+password`), compares the password via `comparePassword`, and returns the same shape as signup (token + user).
- **Protected routes**: The `protect` middleware in `middleware/auth.js` reads the Bearer token, verifies it with `JWT_SECRET`, loads the user by `userId`, attaches `req.user`, and returns 401 on failure. All routes under `/api/boards`, `/api/lists`, and `/api/tasks` use `protect`.
- **Socket authentication**: The Socket.io server uses a middleware that reads the token from `handshake.auth.token` or `handshake.query.token`, verifies the JWT, loads the user, and attaches `socket.user`. Connections without a valid token are rejected.

Token expiry is controlled by `JWT_EXPIRES_IN` (default `7d`). The frontend stores the token (e.g. in localStorage) and sends it on every API request and when opening the socket connection.

---

## WebSocket Integration

- **Library**: Socket.io is attached to the same HTTP server that serves the Express app (`server.js`). The Socket.io instance is stored on the Express app with `app.set("io", io)` so that route handlers can call `req.app.get("io")` to emit events.
- **User room**: On each **connection**, after authentication, the server joins the socket to the room **`user:<userId>`** so that user can receive **assignment notifications** without being on a specific board.
- **Events from client**: 
  - `join_board`: Payload is a board ID. Server checks board access via `getBoardIfAllowed(socket.user._id, boardId)` and, on success, joins the socket to the room `board:<boardId>`. Optional callback reports success or failure.
  - `leave_board`: Payload is a board ID. Socket leaves the room `board:<boardId>`.
- **Events to client**: 
  - **Board room**: After task create/update/delete/move, the route calls `logActivity(io, { boardId, userId, userName, action, task, listId?, fromListId? })`. The service writes to the `ActivityLog` collection and emits to the room `board:<boardId>` one of: `task:created`, `task:updated`, `task:deleted`, `task:moved`, with a payload containing `action`, `userId`, `userName`, `timestamp`, `task`, and optionally `listId`/`fromListId`. Only clients that have joined that board room receive these events.
  - **User room (notifications)**: When a task is created or updated with an `assignedTo` user (and the assignee is not the same as the assigner), the route calls **`notifyTaskAssigned(io, { assigneeId, taskId, taskTitle, boardId, boardName, fromUserId, fromUserName })`**. The service creates a **Notification** document and emits **`task_assigned`** to the room **`user:<assigneeId>`** with payload `type`, `taskId`, `taskTitle`, `boardId`, `boardName`, `fromUserId`, `fromUserName`. Only the assignee’s socket(s) receive this event.

CORS for Socket.io is configurable (e.g. `CORS_ORIGIN` in production); see `server.js` / `socket.js`.

---

## MongoDB Schema Usage

- **Connection**: A single Mongoose connection is established in `db/connect.js` using `MONGODB_URI`. Models are loaded via `models/index.js` before the server listens.
- **Models**: User (auth, password hash); Board (name, createdBy); BoardMember (boardId, userId); List (boardId, title, order); Task (listId, title, description, assignedTo, order); ActivityLog (boardId, userId, action, timestamp); **Notification** (userId, type, taskId, boardId, taskTitle, fromUserId, fromUserName, read). All use `timestamps: true`. Relationships are by ObjectId references; no embedding of full documents. See `docs/database-schema.md` for details and indexes.
- **Usage in routes**: Auth routes use User directly. **Users route** (`/api/users`) uses User to list all users (id, name, email) for the assignee dropdown. Board routes use Board, BoardMember, User, and ActivityLog. List routes use List with board access enforced. Task routes use Task and List, resolve board access via the list’s boardId, and call **notifyTaskAssigned** when a task is assigned. The activity log service uses ActivityLog and the Socket.io instance; the **notification service** uses the Notification model and emits to the user room.

No application logic was changed; this document reflects the implemented backend.
