# LifeLine Pro — Production Deployment Guide

> **Stack**: Railway (backend) · Neon (database) · Vercel (frontend) · Cloudinary (file storage)  
> **Estimated time**: 45–60 minutes for a first deployment  
> **Cost**: ~$6–8/mo (Railway Hobby) · everything else free tier

---

## Overview

```
Browser → Vercel (Vue SPA)
              ↓ HTTPS API calls
         Railway (Express + Socket.IO)
              ↓ PostgreSQL
           Neon (database)
              ↓ File uploads
         Cloudinary (images, PDFs)
```

---

## Prerequisites

You need four accounts. All sign-ups are free:

| Service | URL | Sign up with |
|---------|-----|-------------|
| **Neon** | https://neon.tech | GitHub |
| **Railway** | https://railway.app | GitHub |
| **Vercel** | https://vercel.com | GitHub |
| **Cloudinary** | https://cloudinary.com | Email or Google |

Your code must be pushed to GitHub before deploying. Verify:
```bash
git remote -v   # should show your GitHub repo
git status      # should be clean (nothing uncommitted)
```

---

## Step 1 — Neon (Database)

### 1.1 Create the database

1. Log in to [neon.tech](https://neon.tech)
2. Click **New Project**
3. Name it `lifeline-pro`
4. Region: choose closest to your users (e.g. `AWS eu-west-1` for Nigeria)
5. Click **Create Project**

### 1.2 Copy your connection string

Neon shows a connection string immediately after creation. It looks like:

```
postgresql://postgres:AbCdEfGh@ep-cool-name-123456.eu-west-1.aws.neon.tech/lifeline-pro?sslmode=require
```

**Save this** — you will need it in Step 2.

### 1.3 Note the individual connection parts

From your connection string, extract:

| Variable | Example |
|----------|---------|
| `DB_HOST` | `ep-cool-name-123456.eu-west-1.aws.neon.tech` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `lifeline-pro` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `AbCdEfGh` (the part after the colon) |

---

## Step 2 — Cloudinary (File Storage)

### 2.1 Get your credentials

1. Log in to [cloudinary.com](https://cloudinary.com)
2. On the Dashboard, find **API Environment variable** — it shows all three values at once:
   ```
   CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
   ```
3. Note down:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 2.2 Create an upload folder (optional)

The app will auto-create folders under `lifeline-pro/` on first upload. No manual setup needed.

---

## Step 3 — Railway (Backend)

### 3.1 Create a new project

1. Log in to [railway.app](https://railway.app)
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Select your `LIFELINE-Pro` repository
5. When asked which folder to deploy: set **Root Directory** to `backend`
6. Railway will detect Node.js automatically

### 3.2 Set environment variables

In your Railway project, go to **Variables** and add every variable below.  
Click **+ New Variable** for each one.

#### Required — Database (Neon)
```
DB_TYPE                = postgresql
DB_HOST                = <your Neon host>
DB_PORT                = 5432
DB_NAME                = <your Neon database name>
DB_USER                = <your Neon user>
DB_PASSWORD            = <your Neon password>
DB_SSL                 = true
DB_MAX_POOL            = 10
DB_CONNECTION_TIMEOUT  = 10000
DB_IDLE_TIMEOUT        = 30000
```

#### Required — Security
```
JWT_SECRET             = <generate: openssl rand -base64 48>
JWT_REFRESH_SECRET     = <generate: openssl rand -base64 48>
JWT_EXPIRES_IN         = 24h
JWT_REFRESH_EXPIRES_IN = 7d
BCRYPT_ROUNDS          = 12
```

> **Generate strong secrets on Windows:**
> ```powershell
> # Run this twice — once for JWT_SECRET, once for JWT_REFRESH_SECRET
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
> ```

#### Required — Server
```
NODE_ENV               = production
PORT                   = 5000
```

#### Required — Frontend URL (CORS)
```
FRONTEND_URL           = https://your-vercel-app.vercel.app
CORS_ORIGIN            = https://your-vercel-app.vercel.app
CORS_CREDENTIALS       = true
```
> You will get your Vercel URL in Step 4. Come back and update these two variables after Step 4.

#### Required — Cloudinary (File Uploads)
```
CLOUDINARY_CLOUD_NAME  = <from Cloudinary dashboard>
CLOUDINARY_API_KEY     = <from Cloudinary dashboard>
CLOUDINARY_API_SECRET  = <from Cloudinary dashboard>
CLOUDINARY_UPLOAD_FOLDER = lifeline-pro
```

#### Required — Admin Account
```
DEFAULT_ADMIN_EMAIL    = admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD = <strong password — min 12 chars, upper+lower+number+symbol>
```

#### Optional — Email (Notifications)
```
SMTP_HOST              = smtp.gmail.com
SMTP_PORT              = 587
SMTP_SECURE            = false
SMTP_USER              = your-gmail@gmail.com
SMTP_PASSWORD          = your-gmail-app-password
EMAIL_FROM             = noreply@yourdomain.com
```
> For Gmail: use an App Password (not your login password).  
> Generate at: Google Account → Security → 2-Step Verification → App passwords

#### Optional — Payments
```
PAYSTACK_SECRET_KEY    = sk_live_...
PAYSTACK_PUBLIC_KEY    = pk_live_...
PAYSTACK_WEBHOOK_SECRET = ...
```

#### Cron / System
```
ENABLE_CRON_JOBS       = true
ENABLE_MAINTENANCE_MODE = false
MAX_DEPENDENTS         = 4
SESSION_CLEANUP_DAYS   = 30
RATE_LIMIT_MAX_REQUESTS = 100
RATE_LIMIT_AUTH_MAX    = 5
```

### 3.3 Deploy

1. After setting all variables, Railway will auto-deploy from your last `main` push
2. Watch the **Deploy Logs** — look for:
   ```
   LifeLine Pro API Server started
   Database connection successful
   Socket.IO initialized
   ```
3. If the deploy fails, check the logs for the exact error

### 3.4 Run database migrations

Once the deploy is live, open Railway's **Shell** tab (or use the Railway CLI) and run:

```bash
npm run migrate
```

Then seed the admin user:
```bash
node -e "
import('./src/database/seed.js').then(m => {
  const s = new m.default();
  s.seedAdmin().then(() => { console.log('Admin seeded'); process.exit(0); });
});
"
```

Or more simply — the app auto-seeds the admin from `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` on first boot via `DatabaseInitializer`. Check your deploy logs for:
```
Admin user created: admin@yourdomain.com
```

### 3.5 Note your Railway URL

In Railway, go to **Settings → Networking → Public Domain**.  
It will look like: `https://lifeline-pro-backend.up.railway.app`

**Save this URL** — you need it in Step 4.

---

## Step 4 — Vercel (Frontend)

### 4.1 Import the project

1. Log in to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your `LIFELINE-Pro` GitHub repository
4. When configuring:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### 4.2 Set environment variables

In the Vercel project settings, go to **Settings → Environment Variables** and add:

```
VITE_API_BASE_URL = https://your-railway-backend.up.railway.app/api
```

Replace `your-railway-backend.up.railway.app` with your actual Railway URL from Step 3.5.

### 4.3 Deploy

Click **Deploy**. Vercel will:
1. Install dependencies (`npm ci`)
2. Build the Vue app (`npm run build`)
3. Serve from CDN globally

Your app will be live at: `https://lifeline-pro-frontend.vercel.app`  
(or a custom domain if you add one)

### 4.4 Update Railway CORS with your Vercel URL

Go back to Railway → Variables and update:
```
FRONTEND_URL  = https://lifeline-pro-frontend.vercel.app
CORS_ORIGIN   = https://lifeline-pro-frontend.vercel.app
```

Railway will auto-redeploy after saving.

---

## Step 5 — Verify Everything Works

Run through this checklist after deployment:

### Health checks
```bash
# Backend is alive
curl https://your-railway-backend.up.railway.app/ping

# Expected response:
# {"message":"pong","status":"healthy","database":{"connected":"yes"},...}
```

### Functional checks (do these in the browser)

| Test | Expected Result |
|------|----------------|
| Visit Vercel URL | Landing page loads |
| Register as patient | Redirected to `/login?registered=true` |
| Login with registered account | Redirected to `/patient` dashboard |
| Login as admin | `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` → `/admin` |
| Upload a profile image | Image appears (served from Cloudinary URL) |
| Admin dashboard stats | Numbers load (not error) |

---

## Step 6 — Custom Domain (Optional)

### Vercel (Frontend)
1. Vercel → Settings → Domains
2. Add your domain e.g. `app.lifelinepro.ng`
3. Update your DNS: add a CNAME record pointing to `cname.vercel-dns.com`

### Railway (Backend)
1. Railway → Settings → Networking → Custom Domain
2. Add e.g. `api.lifelinepro.ng`
3. Update your DNS accordingly

After adding custom domains, update Railway variables:
```
FRONTEND_URL = https://app.lifelinepro.ng
CORS_ORIGIN  = https://app.lifelinepro.ng
```

And update Vercel variable:
```
VITE_API_BASE_URL = https://api.lifelinepro.ng/api
```

---

## Troubleshooting

### Backend won't start
Check Railway deploy logs. Common causes:

| Error | Fix |
|-------|-----|
| `Missing required environment variables: JWT_SECRET` | Add `JWT_SECRET` in Railway variables |
| `Database connection failed` | Check `DB_HOST`, `DB_PASSWORD`, `DB_SSL=true` |
| `Port already in use` | Railway manages PORT automatically — ensure `PORT=5000` is set |
| `Cannot find module` | Check Root Directory is set to `backend` in Railway |

### Frontend shows blank page
1. Open browser devtools → Console
2. If you see `Network Error` on API calls: check `VITE_API_BASE_URL` in Vercel env vars
3. If you see 404s: check `vercel.json` rewrites are present in your repo

### File uploads fail in production
1. Check Railway logs for `Cloudinary upload failed`
2. Verify all three Cloudinary vars are set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. In Cloudinary dashboard → Settings → Security: ensure unsigned uploads are enabled or your preset is correct

### CORS errors in browser
The browser will show `Access-Control-Allow-Origin` errors if:
- `CORS_ORIGIN` on Railway doesn't exactly match your Vercel URL
- No trailing slash — `https://app.vercel.app` not `https://app.vercel.app/`

### Migrations didn't run
SSH into Railway shell and run manually:
```bash
npm run migrate
```

---

## Environment Variables Quick Reference

### Railway (Backend) — all required vars at a glance

```bash
NODE_ENV=production
PORT=5000

# Database
DB_TYPE=postgresql
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SSL=true
DB_MAX_POOL=10
DB_CONNECTION_TIMEOUT=10000
DB_IDLE_TIMEOUT=30000

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS / Frontend
FRONTEND_URL=
CORS_ORIGIN=
CORS_CREDENTIALS=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=lifeline-pro

# Admin
DEFAULT_ADMIN_EMAIL=
DEFAULT_ADMIN_PASSWORD=

# Cron
ENABLE_CRON_JOBS=true
ENABLE_MAINTENANCE_MODE=false
MAX_DEPENDENTS=4
SESSION_CLEANUP_DAYS=30
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=

# Payments (optional)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
```

### Vercel (Frontend) — all required vars

```bash
VITE_API_BASE_URL=https://your-railway-backend.up.railway.app/api
```

---

## Ongoing Operations

### Deploying updates
Push to `main` — both Railway and Vercel auto-deploy on every push.

```bash
git add .
git commit -m "your change"
git push origin main
# Railway and Vercel pick this up automatically
```

### Monitoring
- **Railway**: Logs tab shows real-time backend logs
- **Vercel**: Deployments tab shows build logs and function logs
- **Neon**: Monitoring tab shows query volume and compute hours
- **App metrics**: `GET https://your-railway-backend.up.railway.app/metrics`

### Database backups
Neon automatically keeps 7 days of point-in-time restore on the free tier.  
For manual backups, see `docs/DATABASE_BACKUP.md`.

### Scaling up
When you outgrow free tiers:

| Bottleneck | Solution | Cost |
|-----------|---------|------|
| Railway memory | Upgrade to $20/mo plan | +$12/mo |
| Neon storage > 3GB | Upgrade to Launch plan | $19/mo |
| Cloudinary > 25GB | Upgrade to Plus plan | $89/mo |
| Vercel bandwidth > 100GB | Upgrade to Pro | $20/mo |

---

*Last updated: 2026-07-07*
