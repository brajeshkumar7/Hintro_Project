# Database Schema

The application uses MongoDB with Mongoose. All collections use `timestamps: true` (createdAt, updatedAt). IDs are ObjectIds and are exposed as strings in the API.

---

## Collections

### User

| Field     | Type     | Required | Notes                          |
|----------|----------|----------|---------------------------------|
| name     | String   | Yes      | Trimmed                        |
| email    | String   | Yes      | Unique, lowercase, trimmed     |
| password | String   | Yes      | Min length 6; `select: false`   |

- **Indexes**: None beyond the default `_id`. Unique index on `email` is implied by schema option.
- **Behavior**: Password is hashed with bcrypt (10 rounds) in a pre-save hook. Instance method `comparePassword(candidatePassword)` compares with bcrypt.

---

### Board

| Field     | Type     | Required | Notes   |
|----------|----------|----------|---------|
| name     | String   | Yes      | Trimmed |
| createdBy| ObjectId | Yes      | ref: User |

- **Indexes**: `{ createdBy: 1 }` for listing boards by creator.

---

### BoardMember

| Field   | Type     | Required | Notes   |
|--------|----------|----------|---------|
| boardId| ObjectId | Yes      | ref: Board |
| userId | ObjectId | Yes      | ref: User  |

- **Indexes**: `{ boardId: 1 }`, `{ userId: 1 }`, `{ boardId: 1, userId: 1 }` unique. Used to list members of a board and boards for a user, and to avoid duplicate membership.

---

### List

| Field   | Type     | Required | Notes   |
|--------|----------|----------|---------|
| boardId| ObjectId | Yes      | ref: Board |
| title  | String   | Yes      | Trimmed |
| order  | Number   | Yes      | Default 0 |

- **Indexes**: `{ boardId: 1 }`, `{ boardId: 1, order: 1 }`. Used to fetch lists by board and to sort by order.

---

### Task

| Field      | Type     | Required | Notes   |
|-----------|----------|----------|---------|
| listId    | ObjectId | Yes      | ref: List |
| title     | String   | Yes      | Trimmed   |
| description| String  | No       | Default "" |
| assignedTo| ObjectId | No       | ref: User; default null |
| order     | Number   | Yes      | Default 0 |

- **Indexes**: `{ listId: 1 }`, `{ assignedTo: 1 }`, `{ listId: 1, order: 1 }`. Used for listing tasks by list, by assignee, and for ordering within a list. Task search uses a regex on title/description with `listId` in a set of list IDs for the board.

---

### ActivityLog

| Field    | Type     | Required | Notes   |
|---------|----------|----------|---------|
| boardId | ObjectId | Yes      | ref: Board |
| userId  | ObjectId | Yes      | ref: User  |
| action  | String   | Yes      | Trimmed (e.g. task_created, task_updated, task_deleted, task_moved) |
| timestamp| Date    | No       | default Date.now |

- **Indexes**: `{ boardId: 1 }`, `{ userId: 1 }`, `{ boardId: 1, timestamp: -1 }`, `{ timestamp: -1 }`. Used to fetch activity by board (paginated, sorted by timestamp desc) and by user.

---

### Notification

| Field       | Type     | Required | Notes   |
|------------|----------|----------|---------|
| userId     | ObjectId | Yes      | ref: User (assignee) |
| type       | String   | Yes      | Trimmed (e.g. task_assigned) |
| taskId     | ObjectId | Yes      | ref: Task |
| boardId    | ObjectId | Yes      | ref: Board |
| taskTitle  | String   | Yes      | Trimmed |
| fromUserId | ObjectId | Yes      | ref: User (who assigned) |
| fromUserName| String  | Yes      | Trimmed |
| read       | Boolean  | No       | default false |

- **Indexes**: `{ userId: 1, createdAt: -1 }`. Used to list notifications for a user (e.g. for a future notification center). Notifications are created when a task is assigned; the same event is emitted over Socket.io to the assignee’s user room for real-time in-app toasts.

---

## Relationships

- **User** ↔ **Board**: One-to-many as creator (`Board.createdBy`). Many-to-many via **BoardMember** (user can be member of many boards; board has many members).
- **Board** ↔ **List**: One-to-many (`List.boardId`).
- **List** ↔ **Task**: One-to-many (`Task.listId`).
- **User** ↔ **Task**: Optional many-to-one for assignee (`Task.assignedTo`).
- **Board** ↔ **ActivityLog**: One-to-many (`ActivityLog.boardId`). **User** ↔ **ActivityLog**: One-to-many (`ActivityLog.userId`).
- **User** ↔ **Notification**: One-to-many as assignee (`Notification.userId`) and as assigner (`Notification.fromUserId`). **Task** and **Board** are referenced by Notification for context.

No referential integrity is enforced at the database level; the application ensures that listIds belong to the board and that boardId/userId exist when writing.

---

## Indexing Strategy

- **Access patterns**: List boards for user (Board by createdBy + BoardMember by userId); list lists by boardId; list tasks by listId (and filter by board’s list IDs); list tasks by assignedTo; paginate activity by boardId with sort by timestamp; list activity by userId.
- **Indexes** are chosen to support these queries and to keep unique constraints (e.g. BoardMember (boardId, userId)). Compound index `(boardId, timestamp)` on ActivityLog supports the main activity feed query. No full-text or search-specific indexes are defined; task search uses regex on title/description with an `$in` on listId.
