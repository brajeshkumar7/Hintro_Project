# Frontend Architecture

This document describes the structure and patterns of the React frontend.

---

## SPA Structure

The application is a single-page app (SPA) built with React and Vite.

- **Entry**: `index.html` loads `src/main.jsx`, which mounts the root component inside a `BrowserRouter`.
- **Routing**: `App.jsx` defines all routes with `Routes` / `Route`:
  - `/` and `/board/:boardId` are protected (wrapped in `ProtectedRoute`); they render `Home` and `BoardView` respectively.
  - `/login` and `/signup` render `Login` and `Signup`.
  - Any other path redirects to `/`.
- **Pages**: Top-level views live under `src/pages/` (Home, BoardView, Login, Signup). Each page is responsible for loading its data (via store actions and API calls) and rendering the layout.
- **Components**: Reusable UI lives under `src/components/` (e.g. ProtectedRoute, ListColumn, TaskCard, ActivityPanel). They receive props and/or read from Zustand stores; they do not own routing or global auth.

There is no server-side rendering; the same `index.html` and JS bundle serve all routes. The backend is a separate origin (configured via `VITE_API_URL`).

---

## State Management with Zustand

State is held in two Zustand stores.

### `authStore` (`src/store/authStore.js`)

- **State**: `token`, `user` (persisted to `localStorage` under `board_auth` on login/signup and cleared on logout).
- **Actions**: `setAuth(token, user)`, `logout()` (also disconnects Socket.io and clears storage).
- **Usage**: Login/Signup call `setAuth` with the API response; ProtectedRoute and header read `token`/`user`; Axios and socket use `getAuthToken()` (or equivalent) to attach the token. On 401, the Axios response interceptor calls `logout()`.

### `boardStore` (`src/store/boardStore.js`)

- **State**: `boards`, `currentBoardId`, `lists`, `tasks`, `members`, task pagination (`taskPage`, `taskTotal`, `taskTotalPages`, `taskSearch`, `tasksLoadingMore`), activity state (`activities`, `activityPage`, `activityTotal`, `activityTotalPages`, `activitiesLoading`), and `loading`, `error`.
- **Actions**: 
  - Data fetch: `fetchBoards`, `fetchBoardData(boardId)`, `fetchTasksSearch(boardId)`, `fetchMoreTasks(boardId)`, `fetchActivity(boardId)`, `loadMoreActivity(boardId)`.
  - Mutations: `createBoard`, `createList`, `createTask`, `updateTask`, `deleteTask`, `moveTask`.
  - Real-time: `applyTaskCreated`, `applyTaskUpdated`, `applyTaskDeleted`, `applyTaskMoved` (called from socket handlers to update `tasks` without refetch).
  - UI: `setTaskSearch`, `setError`, `clearError`, `clearBoard`, `setCurrentBoard`.
- **Usage**: Home and BoardView dispatch these actions and subscribe to slices of state (e.g. `tasks`, `lists`). ListColumn and TaskCard read from the store (e.g. tasks filtered by `listId`) and call mutation actions. Socket handlers call the `applyTask*` methods so that all clients viewing the same board see the same task list.

No other global state library is used; component-local state is used for forms and UI toggles (e.g. modal open, drag-over).

---

## API Communication Using Axios

- **Instance**: `src/api/axios.js` creates an Axios instance with `baseURL` from `import.meta.env.VITE_API_URL` (default `http://localhost:5000`).
- **Request interceptor**: Adds `Authorization: Bearer <token>` when a token is present (from `getAuthToken()`).
- **Response interceptor**: On 401, calls `logout()` so the user is cleared and can be redirected to login.
- **Modules**: `api/boards.js`, `api/lists.js`, `api/tasks.js`, `api/auth.js` use this instance to call the REST API. They return promises; pages and the board store use them inside async actions (e.g. `fetchBoards`, `createTask`).

All API calls that require authentication rely on the token in the store; there is no separate API client per user.

---

## Real-Time Event Handling

- **Connection**: `src/socket.js` exposes `getSocket(token)`, which creates a Socket.io client connected to `VITE_API_URL` with `auth: { token }`. The same singleton socket is reused while the user is logged in; `disconnect()` is called on logout.
- **Board rooms**: When the user opens a board, the app calls `joinBoard(boardId)`, which emits `join_board` with the board ID. The server checks board access and joins the socket to the room `board:<boardId>`. When leaving the board view, the app calls `leaveBoard(boardId)` (`leave_board`).
- **Event handlers**: On connect, the client registers listeners for `task:created`, `task:updated`, `task:deleted`, `task:moved`. Each handler reads the payload (e.g. `task`, `task.id`) and calls the corresponding `useBoardStore.getState().applyTask*(...)` so the in-memory `tasks` array is updated. React re-renders because Zustand subscriptions trigger when the store changes.
- **Consistency**: The backend emits these events only to the room for that board; the store applies updates only when the task’s `listId` belongs to the current board’s lists (see `applyTaskCreated` / `applyTaskUpdated` / `applyTaskMoved`). Duplicate application (e.g. same task from API response and socket) is avoided by idempotent updates (e.g. replace by `id` or skip if already present).

No application logic was changed; this document reflects the implemented behavior.
