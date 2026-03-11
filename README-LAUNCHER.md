# AI Animation Factory — Launcher Guide

Three scripts make it easy to start and stop the entire stack with a single action.

---

## Files at a Glance

| File | Type | Purpose |
|------|------|---------|
| `start.ps1` | PowerShell | Full launcher with checks, health monitoring, and graceful Ctrl+C shutdown |
| `QUICK-START.bat` | Batch | Double-click launcher — fires up every service in minimized windows |
| `stop-all.ps1` | PowerShell | Stops every service and the Redis container cleanly |

---

## What Each Script Does

### `start.ps1` — Recommended

A complete, interactive launcher that runs every step in the **same terminal window**:

1. **Checks** Node.js ≥ 18, pnpm, Docker
2. **Auto-installs pnpm** if missing
3. **Creates `.env`** from `.env.example` and opens Notepad if keys are missing
4. **Runs `pnpm install`** if `node_modules` are absent
5. **Starts Redis** in a named Docker container (`ai-animation-redis`, port 6379)
   - Pulls the image automatically on first run
   - Re-starts an existing stopped container instead of creating a duplicate
6. **Starts Backend API** (`apps/api`, port 3001) — polls `/health` until it responds
7. **Starts Workers** (`apps/api pnpm worker`) — all 9 BullMQ queues
8. **Starts Frontend** (`apps/web`, port 3000) — polls until Next.js is compiled
9. **Prints a dashboard** with live status and all URLs
10. **Opens the browser** to `http://localhost:3000`
11. **Monitors** jobs in the background and warns if any crash
12. **Ctrl+C** stops all three Node processes cleanly (Redis is left running)

**How to run:**

```powershell
# Option A — right-click → "Run with PowerShell"

# Option B — from any PowerShell terminal
cd C:\ALI_WORKSPACE\01_PROJECTS\ai-animation-factory
.\start.ps1

# Option C — if your system blocks unsigned scripts
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

---

### `QUICK-START.bat` — Simplest

Double-click this file in File Explorer. No terminal needed.

- Launches Backend, Workers, and Frontend in **three separate minimized windows**
- Each window is titled `AI-Factory: Backend API`, `AI-Factory: Workers`, `AI-Factory: Frontend` — easy to find in the taskbar
- Opens the browser automatically after 20 seconds
- Closing this `.bat` window does **not** stop the services — they keep running

**How to run:** Double-click `QUICK-START.bat`

---

### `stop-all.ps1` — Clean Shutdown

Stops everything:

1. PowerShell background jobs left by `start.ps1`
2. Node.js processes on ports 3001 and 3000
3. Any stray `node.exe` / `tsx` processes related to this project
4. The Redis Docker container

**How to run:**

```powershell
# Right-click → "Run with PowerShell"

# Or from a terminal:
.\stop-all.ps1

# Or bypass policy:
powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Home page | http://localhost:3000 |
| Browse episodes | http://localhost:3000/browse |
| CMS Dashboard | http://localhost:3000/cms/episodes |
| Queue Monitor | http://localhost:3000/cms/queue |
| Analytics | http://localhost:3000/cms/analytics |
| CMS Login | http://localhost:3000/login |
| API Health | http://localhost:3001/health |
| Redis | localhost:6379 |

---

## Log Files

All services write logs to the `logs/` directory in the project root:

| File | Contents |
|------|----------|
| `logs/api.log` | Backend API output (Express, routes, errors) |
| `logs/workers.log` | Worker output (job completions, failures) |
| `logs/web.log` | Next.js build and server output |

To watch a log live:
```powershell
Get-Content .\logs\api.log -Wait -Tail 50
```

---

## First-Run Checklist

Before launching for the first time:

- [ ] **Node.js 18+** installed — [https://nodejs.org](https://nodejs.org)
- [ ] **Docker Desktop** installed and signed in — [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- [ ] **Supabase project** created — run `packages/database/schema.sql` in the SQL editor
- [ ] **`.env` file** filled in with real API keys (see `.env.example` for all variables)

Minimum required `.env` keys to start the API without errors:

```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_HOST=localhost
REDIS_PORT=6379
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
OPENAI_API_KEY=
RUNWAY_API_KEY=
ELEVENLABS_API_KEY=
MUBERT_API_KEY=
MUBERT_LICENSE=
JWT_SECRET=          # any random 32+ character string
```

---

## Troubleshooting

### PowerShell says "execution of scripts is disabled"

```powershell
# Run once to allow local scripts (reversible):
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# Or bypass per-run:
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

---

### "Port 3001 is already in use"

`start.ps1` automatically frees the port. If it fails:

```powershell
# Find and kill manually:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
Stop-Process -Id <PID> -Force
```

---

### Redis container fails to start

```powershell
# Check Docker is running:
docker info

# Remove a broken container and let the script recreate it:
docker rm -f ai-animation-redis

# Pull the image manually if auto-pull is slow:
docker pull redis:7-alpine
```

---

### Frontend compiles but shows a blank page

1. Open `logs/web.log` — look for Next.js build errors
2. Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env`
3. Check the browser console for JavaScript errors (F12)

---

### Backend API starts but AI generation fails

1. Check `logs/api.log` for error messages
2. Verify your API keys in `.env` are correct and have sufficient credit/quota
3. Confirm Supabase tables exist — re-run `packages/database/schema.sql` if needed
4. Check Redis connection: `docker exec ai-animation-redis redis-cli ping` should return `PONG`

---

### Workers don't pick up jobs

1. Open `logs/workers.log` — look for connection errors
2. Confirm Redis is running: `docker ps | findstr redis`
3. Restart just the workers by running `stop-all.ps1` then `start.ps1` again

---

### "pnpm install" fails with peer-dependency errors

```powershell
cd C:\ALI_WORKSPACE\01_PROJECTS\ai-animation-factory
pnpm install --no-frozen-lockfile
```

---

### Docker Desktop won't start automatically

Open Docker Desktop manually from the Start menu, wait for it to show "Docker Desktop is running" in the system tray, then re-run the launcher.

---

## Verifying Everything Is Running

After startup, open a new PowerShell window and run:

```powershell
# API health
Invoke-WebRequest http://localhost:3001/health | Select-Object -ExpandProperty Content

# Redis ping
docker exec ai-animation-redis redis-cli ping

# Frontend
Invoke-WebRequest http://localhost:3000 -UseBasicParsing | Select-Object StatusCode
```

All three should succeed. If any fail, check the corresponding log file.

---

## Triggering Your First Episode

1. Open the CMS: http://localhost:3000/cms/episodes
2. Log in (create a user in Supabase `users` table first)
3. Go to **Queue Monitor** → click **Generate Episode**
4. Watch the job progress in real time
5. Once complete, the episode appears in **Browse** with video, audio, and subtitles
