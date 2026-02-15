# Real-Time Sync

This document describes how Socket.io is used for real-time task updates, room strategy, and the approach to data consistency.

---

## Socket Events

### Client → Server

| Event         | Payload   | Description |
|---------------|-----------|-------------|
| join_board    | boardId   | Join the room for this board. Optional callback `(res)` with `{ ok, message? }` or `{ ok, room }`. |
| leave_board   | boardId   | Leave the room for this board. |

**Connection:** Client connects with the JWT in `auth.token` (or `query.token`). Server middleware verifies the token and attaches `socket.user`. Unauthenticated connections are rejected.

---

### Server → Client

Emitted only to the room `board:<boardId>` (so only clients that have joined that board receive them).

| Event         | Payload shape | When emitted |
|---------------|----------------|--------------|
| task:created  | See below      | After a task is created (POST /api/tasks). |
| task:updated  | See below      | After a task is updated (PUT /api/tasks/:id). |
| task:deleted  | See below      | After a task is deleted (DELETE /api/tasks/:id). |
| task:moved    | See below      | After a task is moved (PUT /api/tasks/:id/move). |

**Payload:** `{ action, userId, userName, timestamp, task?, listId?, fromListId? }`.  
- `action`: One of `task_created`, `task_updated`, `task_deleted`, `task_moved`.  
- `task`: For created/updated/moved, the task object (id, listId, title, description, assignedTo, order, createdAt); for deleted, the task object (so clients can remove it by id).  
- `listId` / `fromListId`: Present on `task_moved` (target list and source list).

---

## Room Strategy

- **Room name:** `board:<boardId>` (e.g. `board:507f1f77bcf86cd799439011`). One room per board.
- **Join:** Client sends `join_board` with the board ID. Server checks that `socket.user` has access to that board (creator or BoardMember). If yes, the socket joins the room; if no, the callback returns `{ ok: false, message }`.
- **Leave:** When the user navigates away from the board view, the client sends `leave_board` with the same board ID so the socket leaves the room and stops receiving that board’s events.
- **Emit:** After any task mutation, the backend calls `logActivity(io, { boardId, ... })`, which does `io.to("board:" + boardId).emit(eventName, payload)`. Only sockets in that room receive the event.

There are no per-list or per-user rooms; all viewers of a board share the same room.

---

## Data Consistency Approach

- **Backend:** Task mutations are performed in the REST handler (create/update/delete/move). After the DB write, the handler calls `logActivity`, which (1) inserts an `ActivityLog` document and (2) emits the corresponding Socket event to the board room. The REST response and the Socket payload both reflect the final state (e.g. the created/updated task object).
- **Frontend:**  
  - **Optimistic UI:** The client that performed the action updates its Zustand store from the REST response (or from the mutation method that called the API).  
  - **Other clients:** They receive only the Socket event and apply it via `applyTaskCreated`, `applyTaskUpdated`, `applyTaskDeleted`, or `applyTaskMoved`. These handlers update the `tasks` array in the board store (add, replace by id, remove by id, or replace by id).  
  - **Same client:** The same client may receive the Socket event as well (e.g. they are in the room). The store uses idempotent updates: e.g. createTask checks if a task with that id already exists and replaces instead of appending; apply* methods skip or replace so the same task is not duplicated.  
- **Ordering:** Events are emitted after the DB write. Clients apply events in the order received. No explicit ordering token or version is used; the task payload is the source of truth for that event.
- **Activity log:** Every task mutation is persisted in `ActivityLog` before emission. The activity feed API reads from this collection; real-time listeners only update the in-memory task list and do not rewrite activity.

No application logic was changed; this document reflects the implemented behavior.
