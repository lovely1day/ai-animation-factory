@echo off
setlocal EnableDelayedExpansion

:: ============================================================
:: AI Animation Factory - Quick Start Launcher
:: Double-click this file to start everything automatically.
:: ============================================================

title 🎬 AI Animation Factory — Quick Start
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║    🎬   AI Animation Factory  —  Quick Start           ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: ── Move to project root (wherever this .bat lives) ──────────
cd /d "%~dp0"
echo  📁  Project root: %~dp0
echo.

:: ── Check Node.js ─────────────────────────────────────────────
echo  [1/6] 🔍  Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌  Node.js not found!
    echo      Download and install v18+ from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  ✅  Node.js %NODE_VER%

:: ── Check pnpm ────────────────────────────────────────────────
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️   pnpm not found — installing...
    call npm install -g pnpm >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌  Could not install pnpm.  Run: npm install -g pnpm
        pause
        exit /b 1
    )
    echo  ✅  pnpm installed
) else (
    for /f "tokens=*" %%v in ('pnpm --version') do set PNPM_VER=%%v
    echo  ✅  pnpm !PNPM_VER!
)

:: ── Check .env ────────────────────────────────────────────────
echo.
echo  [2/6] 🔑  Checking .env...
if not exist ".env" (
    if exist ".env.example" (
        echo  ⚠️   .env not found — copying from .env.example
        copy ".env.example" ".env" >nul
        echo.
        echo  ┌─────────────────────────────────────────────────────────┐
        echo  │  ACTION REQUIRED: Open .env and fill in your API keys  │
        echo  │  Then close Notepad and press any key to continue.     │
        echo  └─────────────────────────────────────────────────────────┘
        echo.
        start /wait notepad ".env"
    ) else (
        echo  ❌  .env.example missing.  Re-clone the repository.
        pause
        exit /b 1
    )
) else (
    echo  ✅  .env file found
)

:: ── Install dependencies if needed ───────────────────────────
echo.
echo  [3/6] 📦  Checking dependencies...
if not exist "apps\api\node_modules" (
    echo  ⚙️   Running pnpm install ^(first run — may take ~2 minutes^)...
    call pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌  pnpm install failed.  See errors above.
        pause
        exit /b 1
    )
    echo  ✅  Dependencies installed
) else (
    echo  ✅  Dependencies already installed
)

:: ── Start Redis in Docker ─────────────────────────────────────
echo.
echo  [4/6] 🗄️   Starting Redis...
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️   Docker not found — skipping Redis.
    echo      Install Docker Desktop if you need Redis locally.
    goto :SKIP_REDIS
)

:: Is Docker daemon running?
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️   Docker Desktop is not running.  Attempting to start it...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo  ⏳  Waiting 30 s for Docker to start...
    timeout /t 30 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌  Docker did not start.  Please open Docker Desktop manually,
        echo      then re-run this script.
        pause
        exit /b 1
    )
)

:: Is our named container already running?
for /f "tokens=*" %%c in ('docker ps --filter "name=^/ai-animation-redis$" --format "{{.Names}}" 2^>nul') do set RUNNING_REDIS=%%c
if "!RUNNING_REDIS!"=="ai-animation-redis" (
    echo  ✅  Redis already running
    goto :SKIP_REDIS
)

:: Does a stopped container exist?
for /f "tokens=*" %%c in ('docker ps -a --filter "name=^/ai-animation-redis$" --format "{{.Names}}" 2^>nul') do set EXIST_REDIS=%%c
if "!EXIST_REDIS!"=="ai-animation-redis" (
    echo  ♻️   Restarting stopped Redis container...
    docker start ai-animation-redis >nul
) else (
    echo  🆕  Creating Redis container...
    docker run -d ^
        --name ai-animation-redis ^
        --restart unless-stopped ^
        -p 6379:6379 ^
        redis:7-alpine ^
        redis-server --appendonly yes >nul
)

if %ERRORLEVEL% NEQ 0 (
    echo  ❌  Failed to start Redis container.
    pause
    exit /b 1
)

:: Short wait for Redis to be ready
timeout /t 3 /nobreak >nul
echo  ✅  Redis started  ^(port 6379^)

:SKIP_REDIS

:: ── Start Backend API ─────────────────────────────────────────
echo.
echo  [5/6] ⚙️   Starting Backend API  ^(port 3001^)...
start "AI-Factory: Backend API" /min cmd /c "cd /d "%~dp0apps\api" && pnpm dev"
timeout /t 5 /nobreak >nul
echo  ✅  Backend API process launched

:: ── Start Workers ─────────────────────────────────────────────
echo  🤖  Starting Workers...
start "AI-Factory: Workers" /min cmd /c "cd /d "%~dp0apps\api" && pnpm worker"
timeout /t 3 /nobreak >nul
echo  ✅  Workers process launched

:: ── Start Frontend ────────────────────────────────────────────
echo.
echo  [6/6] 🌐  Starting Frontend  ^(port 3000^)...
start "AI-Factory: Frontend" /min cmd /c "cd /d "%~dp0apps\web" && pnpm dev"

:: ── Wait and open browser ─────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║  ⏳  All services starting up...                        ║
echo  ║                                                          ║
echo  ║  Backend + Workers compile in ~10 s                     ║
echo  ║  Next.js frontend compiles in ~20 s                     ║
echo  ║                                                          ║
echo  ║  Browser will open automatically in 20 seconds...       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

timeout /t 20 /nobreak

:: ── Open browser ──────────────────────────────────────────────
start http://localhost:3000

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   ✅  EVERYTHING IS RUNNING!                            ║
echo  ║                                                          ║
echo  ║   🌐  Frontend        http://localhost:3000             ║
echo  ║   📺  Browse          http://localhost:3000/browse      ║
echo  ║   📊  CMS Dashboard   http://localhost:3000/cms/episodes║
echo  ║   📋  Queue Monitor   http://localhost:3000/cms/queue   ║
echo  ║   🔧  API Health      http://localhost:3001/health      ║
echo  ║                                                          ║
echo  ║   📁  Logs: logs\api.log  workers.log  web.log          ║
echo  ║                                                          ║
echo  ║   To stop: double-click  stop-all.ps1                   ║
echo  ║   (or just close the 3 minimized windows)               ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  Press any key to close this window.
echo  (Services will keep running in their own windows.)
echo.
pause >nul
