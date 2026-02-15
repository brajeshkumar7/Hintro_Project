# Hintro – Full-Stack Board & Task Application

A full-stack collaborative board application with lists, tasks, real-time updates, and activity history. Users can create boards, add lists and tasks, assign members, and see changes live via WebSockets.

---

## Project Overview

The application consists of a **React (Vite)** frontend and a **Node.js (Express)** backend. Data is stored in **MongoDB** and real-time events are delivered via **Socket.io**. Authentication is JWT-based; boards support multiple members and task assignment. Activity for each board is logged and exposed via a paginated API.

---

## Feature List

- **Authentication**: Signup, login, JWT-based sessions, protected routes, auth state persisted in localStorage
- **Boards**: Create boards, list boards (creator + members), view board members
- **Lists**: Create lists per board, list lists by board (ordered)
- **Tasks**: Create, update, delete, and move tasks between lists; assign tasks to board members; search and paginate tasks
- **Activity**: Per-board activity feed (task created/updated/deleted/moved) with pagination
- **Real-time**: Socket.io rooms per board; task mutations emit events so all viewers of a board see updates without refresh
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

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB (connection string; e.g. Atlas or local)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET
npm install
npm start
```

Server runs at **http://localhost:5000** (or `PORT` from `.env`).

### Frontend

```bash
cd frontend
cp .env.example .env
# Optional: set VITE_API_URL if backend is not on http://localhost:5000
npm install
npm run dev
```

App runs at **http://localhost:5173**.

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

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend base URL (default: `http://localhost:5000`) |

---

## Demo Credentials

There are no seeded demo users. After starting backend and frontend:

1. Open **http://localhost:5173**
2. Use **Sign up** to create an account (e.g. name, email, password ≥ 6 characters)
3. You will be logged in and can create boards, lists, and tasks

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
│   ├── models/              # Mongoose schemas (User, Board, BoardMember, List, Task, ActivityLog)
│   ├── routes/
│   │   ├── auth.js          # signup, login, me
│   │   ├── boards.js        # boards CRUD, members, activity
│   │   ├── lists.js         # lists by board, create list
│   │   └── tasks.js         # tasks CRUD, move, pagination, search
│   ├── services/
│   │   └── activityLog.js   # Persist activity + emit to Socket room
│   └── socket.js            # Socket.io server, auth, join_board / leave_board
├── frontend/
│   └── src/
│       ├── api/             # Axios instance + boards, lists, tasks, auth
│       ├── components/       # ProtectedRoute, ListColumn, TaskCard, ActivityPanel
│       ├── pages/            # Home, BoardView, Login, Signup
│       ├── store/            # authStore, boardStore (Zustand)
│       ├── socket.js         # Socket.io client, join/leave board, event → store
│       ├── App.jsx
│       └── main.jsx
└── docs/                     # Architecture and API documentation
```

---

## How Real-Time Updates Work

1. **Backend**: On task create/update/delete/move, the route calls `logActivity(io, { boardId, userId, action, task, ... })`, which writes a row to the `ActivityLog` collection and emits to the Socket.io room `board:<boardId>` (e.g. `task:created`, `task:updated`, `task:deleted`, `task:moved`).
2. **Frontend**: When the user opens a board, the client connects with the JWT and emits `join_board` with that board’s ID. The server validates board access and joins the socket to the room. The client listens for `task:created`, `task:updated`, `task:deleted`, `task:moved` and updates the Zustand board store (e.g. add/update/remove task in the current list). The UI re-renders from the store, so all viewers of the same board see changes without refreshing.

Details: see `docs/realtime-sync.md`.

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
