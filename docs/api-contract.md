# API Contract

All responses are JSON. Error responses include a `message` (and sometimes `error`). IDs are strings (MongoDB ObjectId). Auth is via `Authorization: Bearer <JWT>` unless noted.

---

## Health

| Method | Path    | Auth | Description        |
|--------|---------|------|--------------------|
| GET    | /health | No   | Server health check |

**Response (200):** `{ "status": "ok", "timestamp": "<ISO string>" }`

---

## Auth

Base path: `/api/auth`

| Method | Path   | Auth | Description |
|--------|--------|------|-------------|
| POST   | /signup| No   | Register user |
| POST   | /login | No   | Login        |
| GET    | /me    | Yes  | Current user |

### POST /api/auth/signup

**Body:** `{ "name": string, "email": string, "password": string }`

**Success (201):** `{ "message": "User created", "user": { "id", "name", "email" }, "token": string }`

**Errors:** 400 (validation / missing fields), 409 (email already registered), 500

---

### POST /api/auth/login

**Body:** `{ "email": string, "password": string }`

**Success (200):** `{ "message": "Login successful", "user": { "id", "name", "email" }, "token": string }`

**Errors:** 400 (missing fields), 401 (invalid credentials), 500

---

### GET /api/auth/me

**Headers:** `Authorization: Bearer <token>`

**Success (200):** `{ "user": { "id", "name", "email" } }`

**Errors:** 401 (no/invalid token), 500

---

## Users

Base path: `/api/users`. All routes require auth.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | /    | Yes  | List all users (for assignee dropdown) |

### GET /api/users

**Success (200):** `{ "users": [ { "id", "name", "email" }, ... ] }`

Returns all users in the platform (id, name, email), sorted by name. Used by the frontend to populate the **assignee dropdown** when creating or editing a task so any user can be assigned, not only board members.

**Errors:** 401, 500

---

## Boards

Base path: `/api/boards`. All routes require auth.

| Method | Path                 | Auth | Description        |
|--------|----------------------|------|--------------------|
| POST   | /                    | Yes  | Create board       |
| GET    | /                    | Yes  | List user's boards |
| GET    | /:boardId/members    | Yes  | Board members      |
| GET    | /:boardId/activity   | Yes  | Board activity     |

### POST /api/boards

**Body:** `{ "name": string }`

**Success (201):** `{ "message": "Board created", "board": { "id", "name", "createdBy", "createdAt" } }`

**Errors:** 400 (name missing/invalid), 500

---

### GET /api/boards

**Success (200):** `{ "boards": [ { "id", "name", "createdBy", "createdAt" }, ... ] }`

---

### GET /api/boards/:boardId/members

**Success (200):** `{ "members": [ { "id", "name", "email" }, ... ] }`

**Errors:** 400 (boardId missing), 403 (no access), 404 (board not found), 500

---

### GET /api/boards/:boardId/activity

**Query:** `page` (default 1), `limit` (default 20, max 50)

**Success (200):** `{ "activities": [ { "id", "userId", "userName", "action", "timestamp" }, ... ], "total", "page", "limit", "totalPages" }`

**Errors:** 403, 404, 500

---

## Lists

Base path: `/api/lists`. All routes require auth.

| Method | Path        | Auth | Description     |
|--------|-------------|------|-----------------|
| POST   | /           | Yes  | Create list     |
| GET    | /:boardId   | Yes  | Lists for board |

### POST /api/lists

**Body:** `{ "boardId": string, "title": string, "order"?: number }`

**Success (201):** `{ "message": "List created", "list": { "id", "boardId", "title", "order", "createdAt" } }`

**Errors:** 400 (title/boardId missing), 403/404 (board), 500

---

### GET /api/lists/:boardId

**Success (200):** `{ "lists": [ { "id", "boardId", "title", "order", "createdAt" }, ... ] }`

**Errors:** 403, 404, 500

---

## Tasks

Base path: `/api/tasks`. All routes require auth.

| Method | Path                 | Auth | Description            |
|--------|----------------------|------|------------------------|
| POST   | /                    | Yes  | Create task            |
| GET    | /                    | Yes  | List tasks (by board)  |
| GET    | /assigned-to-me       | Yes  | List tasks assigned to current user |
| PUT    | /:id                 | Yes  | Update task            |
| PUT    | /:id/move            | Yes  | Move task              |
| DELETE | /:id                 | Yes  | Delete task            |

### POST /api/tasks

**Body:** `{ "listId": string, "title": string, "description"?: string, "assignedTo"?: string | null, "order"?: number }`

**Success (201):** `{ "message": "Task created", "task": { "id", "listId", "title", "description", "assignedTo", "order", "createdAt" } }`

**Errors:** 400 (listId/title missing), 403/404 (list/board), 500

---

### GET /api/tasks

**Query:** `boardId` (required), `listId` (optional), `search` (optional), `page` (default 1), `limit` (default 20, max 50)

**Success (200):** `{ "tasks": [ { "id", "listId", "title", "description", "assignedTo", "order", "createdAt" }, ... ], "total", "page", "limit", "totalPages" }`

**Errors:** 400 (boardId missing), 403/404, 500

---

### GET /api/tasks/assigned-to-me

**Query:** `page` (default 1), `limit` (default 20, max 50)

**Success (200):** `{ "tasks": [ { "id", "listId", "title", "description", "assignedTo", "order", "createdAt", "boardId", "boardName", "listTitle" }, ... ], "total", "page", "limit", "totalPages" }`

Returns tasks where `assignedTo` equals the current user’s ID, with board/list context (`boardId`, `boardName`, `listTitle`) for the “Assigned to me” view. Sorted by `updatedAt` descending.

**Errors:** 401, 500

---

### PUT /api/tasks/:id

**Body:** `{ "title"?: string, "description"?: string, "assignedTo"?: string | null, "order"?: number }` (all optional)

**Success (200):** `{ "message": "Task updated", "task": { "id", "listId", "title", "description", "assignedTo", "order", "createdAt" } }`

**Errors:** 400 (invalid id), 403/404, 500

---

### PUT /api/tasks/:id/move

**Body:** `{ "listId": string, "order"?: number }`

**Success (200):** `{ "message": "Task moved", "task": { ... } }`

**Errors:** 400 (listId missing or different board), 403/404, 500

---

### DELETE /api/tasks/:id

**Success (200):** `{ "message": "Task deleted" }`

**Errors:** 400, 403/404, 500

---

## Auth Requirements Summary

- **No auth:** `GET /health`, `POST /api/auth/signup`, `POST /api/auth/login`.
- **Bearer JWT required:** All other endpoints under `/api/auth`, `/api/users`, `/api/boards`, `/api/lists`, `/api/tasks`. Missing or invalid token returns 401.
