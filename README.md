# Hintro – Full-Stack Board & Task Application

A full-stack collaborative board application with lists, tasks, real-time updates, activity history, task assignment to any user, in-app notifications, and an "Assigned to me" view. Users can create boards, add lists and tasks, assign tasks to any platform user, and see changes live via WebSockets.

---

## Project Overview

The application consists of a **React (Vite)** frontend and a **Node.js (Express)** backend in a single repository. Data is stored in **MongoDB** and real-time events are delivered via **Socket.io**. Authentication is JWT-based; boards support multiple members and task assignment. Activity for each board is logged and exposed via a paginated API. Full **architecture**, **API**, and **scalability** documentation are in the `docs/` folder.

---

## Repository and Git

This project is a **complete monorepo** (frontend + backend) ready to push to a Git repository.

**Push to your Git repository:**

```bash
# From the project root (Hintro Project)
git init
git add .
git commit -m "Initial commit: Hintro full-stack board app (frontend + backend)"
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

Ensure `.env` files are not committed (they are listed in `.gitignore`). Copy `backend/.env.example` and `frontend/.env.example` to `.env` locally and set values as described in **Environment Variables** below.

---

## Feature List

- **Authentication**: Signup, login, JWT-based sessions, protected routes, auth state persisted in localStorage
- **Boards**: Create boards, list boards (creator + members), view board members
- **Lists**: Create lists per board, list lists by board (ordered)
- **Tasks**: Create, update, delete, and move tasks between lists; assign tasks to **any user on the platform** (not only board members); search and paginate tasks
- **Assignee dropdown**: When creating or editing a task, the assignee select lists **all users** on the platform (from `GET /api/users`). Board members are still used for display context where needed; the dropdown is populated with the full user list so any user can be assigned.
- **Assigned to me**: A dedicated **“Assigned to me”** view (`/my-tasks`) lists all tasks assigned to the current user across all boards. Each item shows task title, description, board name, list name, and a link to open the board. Pagination is supported.
- **Notifications**: When a task is assigned to you (on create or update), the backend creates a `Notification` record and emits a **`task_assigned`** Socket.io event to your private room. The frontend shows an **in-app toast** (e.g. “X assigned you to ‘Task title’ on board ‘Board name’”) with an optional “View board” link. The socket connects on any protected route so you receive notifications regardless of which page you’re on.
- **Activity**: Per-board activity feed (task created/updated/deleted/moved) with pagination
- **Real-time**: Socket.io rooms per board for task mutations; per-user rooms for assignment notifications; task mutations emit events so all viewers of a board see updates without refresh
- **Drag-and-drop**: Move tasks between list columns in the UI; backend move API and socket event keep state in sync

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| State | Zustand |
| HTTP | Axios |
| Routing | React Router v7 |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io (server + client) |
| Auth | JWT, bcrypt |

---

## Local Setup (Detailed)

### Prerequisites

- **Node.js** 18 or higher  
- **MongoDB** connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local instance)

### Step 1: Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:

- `MONGODB_URI` – your MongoDB connection string (required)
- `JWT_SECRET` – any long random string (required)

Then:

```bash
npm install
npm start
```

The server runs at **http://localhost:5000** (or `PORT` from `.env`). You should see a message like `Server running on http://localhost:5000`.

### Step 2: Frontend

In a new terminal, from the project root:

```bash
cd frontend
cp .env.example .env
```

If the backend is not at `http://localhost:5000`, set `VITE_API_URL` in `frontend/.env` to your backend URL. Then:

```bash
npm install
npm run dev
```

The app runs at **http://localhost:5173**. Open this URL in a browser.

### Step 3: Use the app

- Sign up with name, email, and password (min 6 characters).
- Create a board, add lists, add tasks, and assign them to users (create a second account in another browser/incognito to test assignment and notifications).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | JWT expiry (default: `7d`) |
| `CORS_ORIGIN` | No | Production: comma-separated origins for CORS and Socket.io (e.g. `https://yourapp.onrender.com`). If unset, all origins are allowed so same-origin deploy works and notifications can connect. |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend base URL (default: `http://localhost:5000`) |

---

## Demo Credentials

There are **no pre-seeded users**. Create accounts via **Sign up** after starting the app.

**Suggested demo accounts** (create these yourself for evaluation):

| Role    | Name        | Email             | Password  |
|---------|-------------|-------------------|-----------|
| User 1  | Demo User   | `demo@example.com`   | `demo1234` |
| User 2  | Demo User 2 | `demo2@example.com`  | `demo1234` |

**Steps:**

1. Open **https://hintro-project.onrender.com/** and sign up with User 1 credentials.
2. Log out (or use an incognito window) and sign up with User 2 credentials.
3. Log in as User 1, create a board, add a list and a task, and **assign the task to User 2**.
4. Log in as User 2 (or open the app in another browser): you should see the **in-app notification** (“Demo User assigned you to …”) and can open **Assigned to me** (`/my-tasks`) to see the task.

---

## Folder Structure Overview

```
/
├── backend/
│   ├── app.js              # Express app (routes, middleware; no DB/socket)
│   ├── server.js            # HTTP server, Socket.io, DB connect, listen
│   ├── db/
│   │   └── connect.js       # Mongoose connection
│   ├── middleware/
│   │   ├── auth.js          # JWT protect middleware
│   │   └── boardAccess.js   # Board membership / ownership checks
│   ├── models/              # Mongoose schemas (User, Board, BoardMember, List, Task, ActivityLog, Notification)
│   ├── routes/
│   │   ├── auth.js          # signup, login, me
│   │   ├── boards.js        # boards CRUD, members, activity
│   │   ├── lists.js         # lists by board, create list
│   │   ├── tasks.js         # tasks CRUD, move, assigned-to-me, pagination, search
│   │   └── users.js         # list all users (for assignee dropdown)
│   ├── services/
│   │   ├── activityLog.js   # Persist activity + emit to Socket room
│   │   └── notification.js  # Create Notification + emit task_assigned to user room
│   └── socket.js            # Socket.io server, auth, user room, join_board / leave_board
├── frontend/
│   └── src/
│       ├── api/             # Axios instance + boards, lists, tasks, users, auth
│       ├── components/      # ProtectedRoute, ListColumn, TaskCard, ActivityPanel, ToastContainer, NotificationToast
│       ├── pages/           # Home, BoardView, AssignedToMe, Login, Signup
│       ├── store/           # authStore, boardStore, notificationStore (Zustand)
│       ├── socket.js        # Socket.io client, connect on auth, join/leave board, task_assigned → toast
│       ├── App.jsx
│       └── main.jsx
└── docs/                     # Architecture and API documentation
```

---

## How Real-Time Updates Work

1. **Backend**: On task create/update/delete/move, the route calls `logActivity(io, { boardId, userId, action, task, ... })`, which writes to the `ActivityLog` collection and emits to the Socket.io room `board:<boardId>` (e.g. `task:created`, `task:updated`, `task:deleted`, `task:moved`). When a task is assigned to a user (create or update with `assignedTo`), the route also calls `notifyTaskAssigned(io, { assigneeId, taskId, taskTitle, boardId, boardName, fromUserId, fromUserName })`, which creates a `Notification` document and emits `task_assigned` to the room `user:<assigneeId>`.
2. **Frontend**: The socket is created when the user is on any protected route (e.g. Home or a board). The server joins each connected socket to a private room `user:<userId>` so the user can receive assignment notifications. When the user opens a board, the client emits `join_board` with that board’s ID; the server joins the socket to `board:<boardId>`. The client listens for `task:created`, `task:updated`, `task:deleted`, `task:moved` and updates the board store, and for `task_assigned` it adds a toast via the notification store. The UI re-renders from the store, so all viewers of the same board see changes without refreshing, and the assignee sees a notification toast.

Details: see `docs/realtime-sync.md`.

---

## Architecture

- **Frontend:** Single-page app (React + Vite). State with Zustand (`authStore`, `boardStore`, `notificationStore`). API calls via Axios; Socket.io client for real-time; routes: `/` (boards), `/board/:boardId`, `/my-tasks` (assigned to me), `/login`, `/signup`. Protected routes ensure the socket connects so the user receives assignment notifications on any page.
- **Backend:** Express app with REST routes under `/api` (auth, users, boards, lists, tasks). Socket.io on the same HTTP server; JWT auth on connection; per-board rooms for task events and per-user rooms for assignment notifications. MongoDB via Mongoose; no server-side sessions.
- **Data flow:** REST for CRUD; Socket.io for live task updates (board room) and assignment toasts (user room). Activity and notifications are persisted; the “Assigned to me” view uses the tasks API filtered by `assignedTo`.

**Detailed architecture:**

- [docs/frontend-architecture.md](docs/frontend-architecture.md) – SPA structure, Zustand, Axios, real-time handling, notifications
- [docs/backend-architecture.md](docs/backend-architecture.md) – Express layout, REST design, auth, WebSockets, MongoDB

---

## API Documentation

Full **REST API documentation** (endpoints, request/response formats, auth):  
**[docs/api-contract.md](docs/api-contract.md)**

Covers: health, auth (signup, login, me), users (list all), boards (CRUD, members, activity), lists, tasks (CRUD, move, **assigned-to-me**), and auth requirements.

---

## Assumptions and Trade-offs

- **Single server:** Real-time works with one backend instance; multiple instances require a shared Socket.io adapter (e.g. Redis) for notifications and board updates to reach all clients.
- **Best-effort real-time:** If a client misses an event (e.g. disconnect), the next load refetches from the API; no offline queue or conflict resolution.
- **Auth:** JWT in localStorage for simplicity; for higher security, consider httpOnly cookies or short-lived tokens with refresh.
- **No rate limiting or pre-seeded users:** Add rate limiting and optional seed script for production or stricter demos.

**Full list:** [docs/scalability.md](docs/scalability.md) – horizontal scaling, WebSocket scaling, DB indexing, trade-offs and assumptions.

---

## Running on Render (High Level)

1. **Backend (Web Service)**
   - Build: none (Node).
   - Start: `npm start` (runs `node server.js`).
   - Set env: `MONGODB_URI`, `JWT_SECRET`, and optionally `PORT`, `NODE_ENV`, `JWT_EXPIRES_IN`.
   - Render assigns a URL (e.g. `https://your-backend.onrender.com`).

2. **Frontend (Static Site or Web Service)**
   - Build: `npm run build` (Vite).
   - Set env: `VITE_API_URL=https://your-backend.onrender.com`.
   - Deploy the `dist` output (or serve it with a static server).

3. **CORS**
   - Backend uses `cors()` with no origin restriction by default; for production you may restrict `origin` to the frontend URL.

4. **WebSockets**
   - Socket.io connects to the same host as the API (`VITE_API_URL`). Ensure the Render plan supports persistent connections (WebSockets) if you rely on real-time updates.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/frontend-architecture.md](docs/frontend-architecture.md) | SPA structure, Zustand, Axios, real-time handling |
| [docs/backend-architecture.md](docs/backend-architecture.md) | Express layout, REST design, auth, WebSockets, MongoDB usage |
| [docs/database-schema.md](docs/database-schema.md) | Collections, relationships, indexes |
| [docs/api-contract.md](docs/api-contract.md) | REST endpoints, request/response, auth requirements |
| [docs/realtime-sync.md](docs/realtime-sync.md) | Socket events, rooms, consistency |
| [docs/scalability.md](docs/scalability.md) | Scaling, WebSockets, DB, trade-offs |