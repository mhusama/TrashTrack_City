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

Set a user's `role` to `admin` in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Environment

**Backend** (`backend/.env`):

- `PORT` — default `5000`
- `MONGODB_URI` — Mongo connection string
- `JWT_SECRET` — token signing secret
- `CLIENT_URL` — frontend origin for CORS
- `SMTP_*` — optional email on new reports

**Frontend** (`frontend/.env`):

- `VITE_API_URL` — API base URL (leave empty in dev to use Vite proxy)

## License

ISC
