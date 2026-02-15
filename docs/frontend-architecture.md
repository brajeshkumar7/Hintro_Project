# Frontend Architecture

This document describes the structure and patterns of the React frontend.

---

## SPA Structure

The application is a single-page app (SPA) built with React and Vite.

- **Entry**: `index.html` loads `src/main.jsx`, which mounts the root component inside a `BrowserRouter`.
- **Routing**: `App.jsx` defines all routes with `Routes` / `Route`:
  - `/`, `/board/:boardId`, and `/my-tasks` are protected (wrapped in `ProtectedRoute`); they render `Home`, `BoardView`, and `AssignedToMe` respectively.
  - `/login` and `/signup` render `Login` and `Signup`.
  - Any other path redirects to `/`.
- **Pages**: Top-level views live under `src/pages/` (Home, BoardView, AssignedToMe, Login, Signup). Each page is responsible for loading its data (via store actions and API calls) and rendering the layout. **AssignedToMe** fetches tasks assigned to the current user via `GET /api/tasks/assigned-to-me` and displays them with board/list context and a link to open each board.
- **Components**: Reusable UI lives under `src/components/` (e.g. ProtectedRoute, ListColumn, TaskCard, ActivityPanel, ToastContainer, NotificationToast). They receive props and/or read from Zustand stores; they do not own routing or global auth. **ToastContainer** renders in-app notification toasts from the notification store; **NotificationToast** shows a single toast (e.g. “X assigned you to ‘Task’ on board ‘Y’”) with optional “View board” and dismiss.

There is no server-side rendering; the same `index.html` and JS bundle serve all routes. The backend is a separate origin (configured via `VITE_API_URL`).

---

## State Management with Zustand

State is held in two Zustand stores.

### `authStore` (`src/store/authStore.js`)

- **State**: `token`, `user` (persisted to `localStorage` under `board_auth` on login/signup and cleared on logout).
- **Actions**: `setAuth(token, user)`, `logout()` (also disconnects Socket.io and clears storage).
- **Usage**: Login/Signup call `setAuth` with the API response; ProtectedRoute and header read `token`/`user`; Axios and socket use `getAuthToken()` (or equivalent) to attach the token. On 401, the Axios response interceptor calls `logout()`.

### `boardStore` (`src/store/boardStore.js`)

- **State**: `boards`, `currentBoardId`, `lists`, `tasks`, `members`, **`allUsers`** (full platform user list for assignee dropdown), task pagination (`taskPage`, `taskTotal`, `taskTotalPages`, `taskSearch`, `tasksLoadingMore`), activity state (`activities`, `activityPage`, `activityTotal`, `activityTotalPages`, `activitiesLoading`), and `loading`, `error`.
- **Actions**: 
  - Data fetch: `fetchBoards`, `fetchBoardData(boardId)` (also fetches **all users** for assignee dropdown), **`fetchAllUsers()`** (refreshes `allUsers`), `fetchTasksSearch(boardId)`, `fetchMoreTasks(boardId)`, `fetchActivity(boardId)`, `loadMoreActivity(boardId)`.
  - Mutations: `createBoard`, `createList`, `createTask`, `updateTask`, `deleteTask`, `moveTask`.
  - Real-time: `applyTaskCreated`, `applyTaskUpdated`, `applyTaskDeleted`, `applyTaskMoved` (called from socket handlers to update `tasks` without refetch).
  - UI: `setTaskSearch`, `setError`, `clearError`, `clearBoard`, `setCurrentBoard`.
- **Usage**: Home and BoardView dispatch these actions and subscribe to slices of state. ListColumn and TaskCard read from the store; **TaskCard** uses **`allUsers`** (fallback to `members` if empty) for the **assignee dropdown** so any platform user can be assigned. Socket handlers call the `applyTask*` methods so that all clients viewing the same board see the same task list.

### `notificationStore` (`src/store/notificationStore.js`)

- **State**: `toasts` (array of toast objects: id, type, message, taskTitle, boardId, boardName, fromUserName).
- **Actions**: `addToast(payload)` (adds a toast and returns its id), `removeToast(id)`.
- **Usage**: The Socket.io client listens for **`task_assigned`** and calls `addToast` with the payload (taskTitle, boardId, boardName, fromUserName). **ToastContainer** (mounted in `App.jsx`) renders each toast; **NotificationToast** shows the message and “View board” / dismiss; toasts auto-dismiss after a short delay.

No other global state library is used; component-local state is used for forms and UI toggles (e.g. modal open, drag-over).

---

## API Communication Using Axios

- **Instance**: `src/api/axios.js` creates an Axios instance with `baseURL` from `import.meta.env.VITE_API_URL` (default `http://localhost:5000`).
- **Request interceptor**: Adds `Authorization: Bearer <token>` when a token is present (from `getAuthToken()`).
- **Response interceptor**: On 401, calls `logout()` so the user is cleared and can be redirected to login.
- **Modules**: `api/boards.js`, `api/lists.js`, `api/tasks.js`, **`api/users.js`** (GET /api/users for assignee dropdown), `api/auth.js` use this instance to call the REST API. They return promises; pages and the board store use them inside async actions (e.g. `fetchBoards`, `createTask`, **`getUsers`**, **`getTasksAssignedToMe`**).

All API calls that require authentication rely on the token in the store; there is no separate API client per user.

---

## Real-Time Event Handling

- **Connection**: `src/socket.js` exposes `getSocket(token)`, which creates a Socket.io client connected to the API URL with `auth: { token }`. The same singleton socket is reused while the user is logged in; `disconnect()` is called on logout. **ProtectedRoute** calls `getSocket(token)` when the user is authenticated so the socket connects on any protected page (Home, board, or Assigned to me), ensuring the user is in the server’s **user room** and can receive **task_assigned** notifications even when not on a board.
- **User room**: On connection, the server joins the socket to the room `user:<userId>`. The backend emits **`task_assigned`** to that room when a task is assigned to that user; the client listens for `task_assigned` and calls `useNotificationStore.getState().addToast(...)` so an in-app toast is shown.
- **Board rooms**: When the user opens a board, the app calls `joinBoard(boardId)`, which emits `join_board` with the board ID. The server checks board access and joins the socket to the room `board:<boardId>`. When leaving the board view, the app calls `leaveBoard(boardId)` (`leave_board`).
- **Event handlers**: On connect, the client registers listeners for `task:created`, `task:updated`, `task:deleted`, `task:moved`, and **`task_assigned`**. The task handlers call the corresponding `useBoardStore.getState().applyTask*(...)`; the **task_assigned** handler calls `notificationStore.addToast` with the payload (taskTitle, boardId, boardName, fromUserName). React re-renders when the stores change.
- **Consistency**: The backend emits board events only to the room for that board; the store applies updates only when the task’s `listId` belongs to the current board’s lists. Duplicate application is avoided by idempotent updates. Notifications are one-way (server → assignee); no conflict resolution is needed.

No application logic was changed; this document reflects the implemented behavior.
