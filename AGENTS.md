# AGENTS.md

## Cursor Cloud specific instructions

TrashTrack City is a two-package MERN app (`backend/` + `frontend/`). There is no root `package.json`, Docker, or docker-compose. See `README.md` for API and environment variable details.

### Services

| Service | Port | Start command |
|---------|------|---------------|
| Backend API (Express) | 5000 | `cd backend && npm run dev` |
| Frontend (Vite + React) | **5174** | `cd frontend && npm run dev` |

Health check: `GET http://localhost:5000/api/health`

The frontend dev server proxies `/api` and `/uploads` to the backend (`frontend/vite.config.js`). Leave `VITE_API_URL` empty in `frontend/.env` for local dev.

**Port note:** `README.md` mentions port 5173, but `vite.config.js` defaults to **5174**. Use 5174 locally and set `CLIENT_URL=http://localhost:5174` in `backend/.env`.

### MongoDB

The backend connects to MongoDB Atlas via `backend/.env` (`MONGODB_URI`). Three logical databases on the same cluster: `test` (residents/reports), `tt_admin` (admins), `c_c` (cleaning crew). Local MongoDB is optional if Atlas credentials are configured.

### Lint / test / build

| Check | Command | Notes |
|-------|---------|-------|
| Frontend lint | `cd frontend && npm run lint` | Pre-existing ESLint flat config does not enable JSX parsing; many `.jsx` files report `Unexpected token <`. Build still succeeds. |
| Frontend build | `cd frontend && npm run build` | Production output in `frontend/dist/` |
| Backend tests | — | No Jest/Vitest suite. Optional: `cd backend && npm run test:smtp -- your@email.com` |
| Backend lint | — | No ESLint configured |

### Auth quirks for API testing

- `POST /api/auth/login` requires a `role` field (`resident`, `admin`, or `cleaning_crew`).
- `POST /api/auth/register` requires multipart form data with `nidFront` and `nidBack` image uploads for all roles.

### Long-running dev servers

Use tmux (or separate terminals) for backend and frontend `npm run dev` processes. Both use nodemon/Vite file watching.
