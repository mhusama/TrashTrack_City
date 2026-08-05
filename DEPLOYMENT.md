# 🚀 Free Portfolio Hosting Guide (Strategy 1)

This guide walks you through hosting **TrashTrack City** 100% **free of charge** while guaranteeing **instant load times for recruiters** (< 300ms) with zero sleeping server delays.

---

## 🛠️ Architecture Overview

| Service | Host | Tier | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Free Hobby | React SPA with global CDN |
| **Backend** | [Render](https://render.com) | Free Web Service | Express REST API |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | M0 Free (512MB) | NoSQL Database |
| **Upload Storage** | [Cloudinary](https://cloudinary.com) | Free Tier (25GB) | Report photos & user avatars |
| **Keep-Alive Bot** | [Cron-Job.org](https://cron-job.org) | Free | Pings backend to prevent sleep |

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign up / log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new project and build a **Free M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g. username `appuser`, password `yourpassword`).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers**, and copy your connection string:
   ```env
   mongodb+srv://appuser:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 2: Set Up Cloudinary (Image Storage)

1. Sign up for a free account at [Cloudinary.com](https://cloudinary.com).
2. On your Cloudinary Dashboard, copy these 3 credentials:
   * **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   * **API Key** (`CLOUDINARY_API_KEY`)
   * **API Secret** (`CLOUDINARY_API_SECRET`)

---

## Step 3: Deploy Backend to Render

1. Push your project repository to GitHub.
2. Sign up / log in to [Render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   * **Name:** `trashtrack-backend`
   * **Root Directory:** `backend`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
6. Add the following **Environment Variables**:

| Key | Example Value / Description |
| :--- | :--- |
| `PORT` | `5000` |
| `MONGODB_URI` | *Your MongoDB Atlas connection string from Step 1* |
| `MONGODB_DB_NAME` | `test` |
| `MONGODB_ADMIN_DB_NAME` | `tt_admin` |
| `JWT_SECRET` | *Any random secure string (e.g. `supersecretjwtkey123`)* |
| `CLIENT_URL` | *Your Vercel frontend URL (e.g. `https://trashtrack-city.vercel.app`)* |
| `CLOUDINARY_CLOUD_NAME` | *From Step 2* |
| `CLOUDINARY_API_KEY` | *From Step 2* |
| `CLOUDINARY_API_SECRET` | *From Step 2* |

7. Click **Create Web Service**. Wait for the build to finish.
8. Copy your published backend URL (e.g. `https://trashtrack-backend.onrender.com`). Test it by visiting `https://trashtrack-backend.onrender.com/api/health`.

---

## Step 4: Keep Backend Awake (Prevent Recruiter Delay)

Render free instances go to sleep after 15 minutes of inactivity. To ensure **instant loading for recruiters**:

1. Sign up for a free account on **[Cron-Job.org](https://cron-job.org)** (or **[UptimeRobot](https://uptimerobot.com)**).
2. Click **Create Cronjob**.
3. **URL:** `https://trashtrack-backend.onrender.com/api/health` (replace with your Render backend URL).
4. **Execution Schedule:** Every **10 minutes** (`*/10 * * * *`).
5. Save the job.
   > Now your backend will stay awake 24/7 and respond in milliseconds when anyone opens your portfolio!

---

## Step 5: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Edit and select `frontend`.
5. Under **Environment Variables**, add:
   * **Name:** `VITE_API_URL`
   * **Value:** `https://trashtrack-backend.onrender.com` *(Your Render backend URL)*
6. Click **Deploy**.

---

## ✅ Verification Checklist

* [ ] Open your Vercel URL (e.g., `https://trashtrack-city.vercel.app`).
* [ ] Register a new resident account.
* [ ] Create a report with a photo attachment. Verify the image loads from Cloudinary.
* [ ] Check `https://cron-job.org` dashboard to confirm your keep-alive ping is active.

🎉 **Your app is now live, free, persistent, and lightning fast for recruiters!**
