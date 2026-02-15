# Full-Stack App

## Structure

- **backend** – Node.js + Express REST API
- **frontend** – React + Vite

## Run locally

### Backend

```bash
cd backend
cp .env.example .env   # optional: set PORT if 5000 is in use
npm install
npm start
```

Server runs at `http://localhost:5000`. Health check: `GET http://localhost:5000/health`

### Frontend

```bash
cd frontend
cp .env.example .env   # optional: set VITE_API_URL for API base URL
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Env (Render-friendly)

- **Backend**: `PORT` (default 5000), `NODE_ENV`
- **Frontend**: `VITE_API_URL` (e.g. your Render backend URL in production)
