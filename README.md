# TrashTrack City

Sample **MERN** stack app for reporting and tracking city waste issues. Residents submit geotagged reports with optional photos; admins can update report status.

## Stack

| Layer    | Tech |
|----------|------|
| MongoDB  | Mongoose |
| Express  | REST API, Multer uploads, Nodemailer (optional) |
| React    | Vite 8, React 19, React Router 7 |
| Node     | ES modules |

**Frontend extras:** Tailwind CSS 4, Leaflet map, Framer Motion, react-easy-crop, react-hot-toast, Axios, Lucide icons.

## Project structure

```
TrashTrack_City/
├── backend/          # Express API
│   └── src/
│       ├── server.js
│       ├── models/     # User, Report
│       ├── routes/
│       └── ...
└── frontend/         # Vite + React SPA
    └── src/
        ├── pages/
        ├── components/
        └── api/
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [MongoDB](https://www.mongodb.com/) running locally or Atlas URI

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

API: `http://localhost:5000`  
Health: `GET /api/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Optional: VITE_API_URL=http://localhost:5000 (dev uses Vite proxy if empty)
npm install
npm run dev
```

App: `http://localhost:5173`

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/reports` | Bearer | List reports |
| POST | `/api/reports` | Bearer | Create report (multipart: `photo`) |
| PATCH | `/api/reports/:id/status` | Admin | Update status |
| DELETE | `/api/reports/:id` | Bearer | Delete own report (or admin) |

### Admin user

Register through the app with role **Admin**, or insert directly into the **`tt_admin`** database (`users` collection) on your cluster. Residents and app data (reports, notifications) stay in the **`test`** database (or the name set by `MONGODB_DB_NAME`). Cleaning crew accounts are stored in the **`c_c`** database.

> **Note:** Do not use MongoDB’s built-in `admin` database for app accounts (used for Atlas login). That causes “not authorized” errors. Use `tt_admin` instead (set `MONGODB_ADMIN_DB_NAME`).

### MongoDB databases

| Database | Contents |
|----------|----------|
| `test` (default via `MONGODB_DB_NAME`) | Residents, reports, notifications |
| `tt_admin` | Admin accounts and credentials |
| `c_c` | Cleaning crew accounts and credentials |

Configure in `backend/.env` — see `backend/.env.example`. Staff URIs are derived from `MONGODB_URI` when `MONGODB_URI_ADMIN` / `MONGODB_URI_CREW` are omitted.

## Environment

**Backend** (`backend/.env`):

- `PORT` — default `5000`
- `MONGODB_URI` — Mongo cluster connection string
- `MONGODB_DB_NAME` — main app database (default `test`: residents, reports)
- `MONGODB_ADMIN_DB_NAME` — admin accounts database (default `tt_admin`; not MongoDB’s `admin` auth DB)
- `MONGODB_URI_ADMIN` — optional full URI override for admin accounts DB
- `MONGODB_URI_CREW` — optional; defaults to `c_c` database on the same cluster
- `JWT_SECRET` — token signing secret
- `CLIENT_URL` — frontend origin for CORS and password reset links (2-minute expiry)
- `SMTP_*` — email for password reset and report notifications (see `backend/.env.example`)
  - Test: `cd backend && npm run test:smtp -- your@email.com`

**Frontend** (`frontend/.env`):

- `VITE_API_URL` — API base URL (leave empty in dev to use Vite proxy)

## License

ISC
