#Requires -Version 5.1
<#
.SYNOPSIS
    AI Animation Factory - Full Stack Launcher
.DESCRIPTION
    Checks prerequisites, installs dependencies, starts Redis + Backend +
    Workers + Frontend, then opens the browser.  Press Ctrl+C to stop all.
.NOTES
    Run from the project root:  .\start.ps1
    To bypass execution policy:  powershell -ExecutionPolicy Bypass -File .\start.ps1
#>

# ── Config ─────────────────────────────────────────────────────────────────────
$ROOT         = $PSScriptRoot
$API_DIR      = Join-Path $ROOT  "apps\api"
$WEB_DIR      = Join-Path $ROOT  "apps\web"
$LOG_DIR      = Join-Path $ROOT  "logs"
$ENV_FILE     = Join-Path $ROOT  ".env"
$ENV_EXAMPLE  = Join-Path $ROOT  ".env.example"

$REDIS_NAME   = "ai-animation-redis"
$REDIS_PORT   = 6379
$API_PORT     = 3001
$WEB_PORT     = 3000
$HEALTH_URL   = "http://localhost:$API_PORT/health"
$WEB_URL      = "http://localhost:$WEB_PORT"

$script:Jobs      = @{}
$script:StartTime = Get-Date
$script:SkipDocker = $false

# ── UI helpers ──────────────────────────────────────────────────────────────────
function Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║    🎬   AI Animation Factory  —  Launcher                  ║" -ForegroundColor Cyan
    Write-Host "  ║    🤖   GPT-4 · DALL-E 3 · Runway · ElevenLabs · FFmpeg   ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Divider  { Write-Host "  ─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray }
function Step($m) { Write-Host "  ➤  $m" -ForegroundColor Cyan }
function OK($m)   { Write-Host "  ✅  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠️   $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "  ❌  $m" -ForegroundColor Red }
function Info($m) { Write-Host "  ℹ️   $m" -ForegroundColor White }

function ServiceRow {
    param([string]$Label, [bool]$Up, [string]$Url = "")
    $icon  = if ($Up) { "🟢" } else { "🔴" }
    $state = if ($Up) { "Running" } else { "Stopped" }
    $color = if ($Up) { "Green"   } else { "Red"     }
    $right = if ($Url) { " → $Url" } else { "" }
    Write-Host "  $icon  $($Label.PadRight(12)) " -NoNewline
    Write-Host $state -ForegroundColor $color -NoNewline
    Write-Host $right -ForegroundColor DarkGray
}

# ── 1. Prerequisites ────────────────────────────────────────────────────────────
function Assert-Prerequisites {
    Divider
    Write-Host "  📋  Prerequisites" -ForegroundColor Magenta
    Divider

    # Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Fail "Node.js not found.  Install v18+ from https://nodejs.org"
        exit 1
    }
    $nodeVer = [int]((node --version) -replace 'v','').Split('.')[0]
    if ($nodeVer -lt 18) {
        Fail "Node.js v18+ required (you have v$nodeVer).  Please upgrade."
        exit 1
    }
    OK "Node.js $(node --version)"

    # pnpm
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Warn "pnpm not found — installing globally..."
        npm install -g pnpm 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Fail "Could not install pnpm.  Run: npm install -g pnpm"; exit 1 }
        OK "pnpm installed"
    } else {
        OK "pnpm $(pnpm --version)"
    }

    # Docker (optional — only needed for Redis)
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Warn "Docker not found.  Redis will be skipped."
        Warn "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        $script:SkipDocker = $true
    } else {
        OK "Docker $(docker --version 2>&1 | Select-String '\d+\.\d+' | ForEach-Object { $_.Matches[0].Value })"
    }

    Write-Host ""
}

# ── 2. .env file ────────────────────────────────────────────────────────────────
function Assert-EnvFile {
    Divider
    Write-Host "  🔑  Environment Configuration" -ForegroundColor Magenta
    Divider

    if (-not (Test-Path $ENV_FILE)) {
        if (Test-Path $ENV_EXAMPLE) {
            Warn ".env not found — copying from .env.example"
            Copy-Item $ENV_EXAMPLE $ENV_FILE
            Write-Host ""
            Write-Host "  ┌────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
            Write-Host "  │  ACTION REQUIRED: Add your API keys to .env               │" -ForegroundColor Yellow
            Write-Host "  │                                                            │" -ForegroundColor Yellow
            Write-Host "  │  Minimum required:                                         │" -ForegroundColor Yellow
            Write-Host "  │    SUPABASE_URL + SUPABASE_SERVICE_KEY                    │" -ForegroundColor Yellow
            Write-Host "  │    OPENAI_API_KEY                                         │" -ForegroundColor Yellow
            Write-Host "  │    RUNWAY_API_KEY                                         │" -ForegroundColor Yellow
            Write-Host "  │    ELEVENLABS_API_KEY                                     │" -ForegroundColor Yellow
            Write-Host "  │    R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY  │" -ForegroundColor Yellow
            Write-Host "  │    R2_BUCKET_NAME + R2_PUBLIC_URL                         │" -ForegroundColor Yellow
            Write-Host "  │    JWT_SECRET (any random 32-char string)                 │" -ForegroundColor Yellow
            Write-Host "  └────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow
            Write-Host ""
            $ans = Read-Host "  Open .env in Notepad now? [Y/n]"
            if ($ans -ne 'n' -and $ans -ne 'N') {
                Start-Process notepad $ENV_FILE -Wait
            }
            $ans2 = Read-Host "  Ready to continue? [Y/n]"
            if ($ans2 -eq 'n' -or $ans2 -eq 'N') { exit 0 }
        } else {
            Fail ".env.example is also missing.  Re-clone the repository."
            exit 1
        }
    } else {
        OK ".env exists"
        # Warn about unfilled placeholder values
        $raw = Get-Content $ENV_FILE -Raw
        $unfilled = @(
            'your-openai-key','your-runway-key','your-elevenlabs',
            'your-mubert','your-r2','your-supabase','your-service-role',
            'your-super-secret'
        ) | Where-Object { $raw -imatch $_ }
        if ($unfilled.Count -gt 0) {
            Warn "Placeholder values still present in .env — AI features will fail until fixed."
        }
    }
    Write-Host ""
}

# ── 3. Dependencies ─────────────────────────────────────────────────────────────
function Install-Deps {
    Divider
    Write-Host "  📦  Dependencies" -ForegroundColor Magenta
    Divider

    $apiModules = Join-Path $API_DIR "node_modules"
    $webModules = Join-Path $WEB_DIR "node_modules"

    if (-not (Test-Path $apiModules) -or -not (Test-Path $webModules)) {
        Step "Running pnpm install (first run — may take ~2 minutes)..."
        Push-Location $ROOT
        try {
            pnpm install 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
            if ($LASTEXITCODE -ne 0) { throw "pnpm install exited with code $LASTEXITCODE" }
            OK "All dependencies installed"
        } catch {
            Fail "Dependency install failed: $_"
            Pop-Location; exit 1
        }
        Pop-Location
    } else {
        OK "node_modules already present  (delete them and re-run to refresh)"
    }
    Write-Host ""
}

# ── 4. Redis ────────────────────────────────────────────────────────────────────
function Start-Redis {
    if ($script:SkipDocker) { return }

    Divider
    Write-Host "  🗄️   Redis" -ForegroundColor Magenta
    Divider

    # Make sure Docker daemon is responsive
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Warn "Docker daemon not running — attempting to start Docker Desktop..."
        $dockerExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerExe) {
            Start-Process $dockerExe
            Step "Waiting for Docker Desktop (up to 90 s)..."
            $waited = 0
            while ($waited -lt 90) {
                Start-Sleep 3; $waited += 3
                $null = docker info 2>&1
                if ($LASTEXITCODE -eq 0) { OK "Docker is ready"; break }
                Write-Host "    ... $waited s" -ForegroundColor DarkGray
            }
        }
        $null = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            Fail "Docker did not start.  Please open Docker Desktop manually and re-run."
            exit 1
        }
    }

    # Is our container already running?
    $running = docker ps --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
    if ($running -eq $REDIS_NAME) {
        OK "Redis already running  (container: $REDIS_NAME, port: $REDIS_PORT)"
        Write-Host ""
        return
    }

    # Does a stopped container exist?
    $exists = docker ps -a --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
    if ($exists -eq $REDIS_NAME) {
        Step "Restarting stopped Redis container..."
        docker start $REDIS_NAME 2>&1 | Out-Null
    } else {
        Step "Creating Redis container  (redis:7-alpine, port $REDIS_PORT)..."
        docker run -d `
            --name $REDIS_NAME `
            --restart unless-stopped `
            -p "${REDIS_PORT}:6379" `
            redis:7-alpine `
            redis-server --appendonly yes 2>&1 | Out-Null
    }

    if ($LASTEXITCODE -ne 0) {
        Fail "docker run failed — see error above"
        exit 1
    }

    # Wait for PONG
    Step "Waiting for Redis to accept connections..."
    $ok = $false
    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep 1
        $pong = docker exec $REDIS_NAME redis-cli ping 2>&1
        if ($pong -match "PONG") { $ok = $true; break }
    }
    if ($ok) { OK "Redis ready  (port $REDIS_PORT)" } else { Fail "Redis did not respond in 20 s"; exit 1 }
    Write-Host ""
}

# ── Port helpers ────────────────────────────────────────────────────────────────
function Clear-Port {
    param([int]$Port, [string]$Label)
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $conns) { return }
    Warn "Port $Port ($Label) is in use — killing process(es)..."
    $conns.OwningProcess | Sort-Object -Unique | ForEach-Object {
        try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
    }
    Start-Sleep 1
    if (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue) {
        Fail "Port $Port could not be freed.  Stop the process using it and retry."
        exit 1
    }
    OK "Port $Port is now free"
}

# ── 5. Backend API ──────────────────────────────────────────────────────────────
function Start-API {
    Divider
    Write-Host "  ⚙️   Backend API  (port $API_PORT)" -ForegroundColor Magenta
    Divider
    Clear-Port $API_PORT "Backend API"

    $log = Join-Path $LOG_DIR "api.log"
    Step "Launching  pnpm dev  in apps/api..."

    $job = Start-Job -Name "API" -ScriptBlock {
        param($dir, $log, $root)
        Set-Location $dir
        # Load .env so the process picks up keys
        $env:NODE_ENV = "development"
        # Pipe output to log and let PowerShell capture it
        pnpm dev 2>&1 | Tee-Object -FilePath $log -Append
    } -ArgumentList $API_DIR, $log, $ROOT

    $script:Jobs["api"] = $job.Id

    # Poll /health
    Step "Waiting for API health check at $HEALTH_URL..."
    $healthy = $false
    for ($i = 1; $i -le 30; $i++) {
        Start-Sleep 2
        try {
            $r = Invoke-WebRequest -Uri $HEALTH_URL -TimeoutSec 3 -EA Stop
            if ($r.StatusCode -eq 200) { $healthy = $true; break }
        } catch {}
        Write-Host "    waiting... ($($i*2) s)" -ForegroundColor DarkGray
    }

    if ($healthy) {
        OK "Backend API is up  → http://localhost:$API_PORT"
    } else {
        Warn "API did not respond within 60 s.  Check logs\api.log for errors."
        Warn "Services will still launch — API may still be compiling."
    }
    Write-Host ""
}

# ── 6. Workers ──────────────────────────────────────────────────────────────────
function Start-Workers {
    Divider
    Write-Host "  🤖  Workers  (9 queues)" -ForegroundColor Magenta
    Divider

    $log = Join-Path $LOG_DIR "workers.log"
    Step "Launching  pnpm worker  in apps/api..."

    $job = Start-Job -Name "Workers" -ScriptBlock {
        param($dir, $log)
        Set-Location $dir
        $env:NODE_ENV = "development"
        pnpm worker 2>&1 | Tee-Object -FilePath $log -Append
    } -ArgumentList $API_DIR, $log

    $script:Jobs["workers"] = $job.Id

    Start-Sleep 4
    $state = (Get-Job -Name "Workers").State
    if ($state -eq "Running") {
        OK "Workers running  (idea → script → images → animation → voice → music → assembly → subtitles → thumbnail)"
    } else {
        Warn "Workers job is in state '$state'.  Check logs\workers.log"
    }
    Write-Host ""
}

# ── 7. Frontend ─────────────────────────────────────────────────────────────────
function Start-Web {
    Divider
    Write-Host "  🌐  Frontend  (port $WEB_PORT)" -ForegroundColor Magenta
    Divider
    Clear-Port $WEB_PORT "Frontend"

    $log = Join-Path $LOG_DIR "web.log"
    Step "Launching  pnpm dev  in apps/web..."

    $job = Start-Job -Name "Web" -ScriptBlock {
        param($dir, $log)
        Set-Location $dir
        $env:NODE_ENV = "development"
        pnpm dev 2>&1 | Tee-Object -FilePath $log -Append
    } -ArgumentList $WEB_DIR, $log

    $script:Jobs["web"] = $job.Id

    # Next.js needs compile time — be patient
    Step "Waiting for Next.js to compile (up to 90 s)..."
    $up = $false
    for ($i = 1; $i -le 45; $i++) {
        Start-Sleep 2
        try {
            $r = Invoke-WebRequest -Uri $WEB_URL -TimeoutSec 3 -EA Stop
            if ($r.StatusCode -lt 500) { $up = $true; break }
        } catch {}
        Write-Host "    compiling... ($($i*2) s)" -ForegroundColor DarkGray
    }

    if ($up) {
        OK "Frontend is up  → $WEB_URL"
    } else {
        Warn "Frontend did not respond within 90 s.  Check logs\web.log"
    }
    Write-Host ""
}

# ── Dashboard ───────────────────────────────────────────────────────────────────
function Show-Dashboard {
    $elapsed = [math]::Round(((Get-Date) - $script:StartTime).TotalSeconds)
    Header

    Write-Host "  🎉  Services launched in $elapsed s" -ForegroundColor Green
    Write-Host ""
    Divider
    Write-Host "  📡  Live Status" -ForegroundColor Magenta
    Divider
    Write-Host ""

    $redisUp   = (-not $script:SkipDocker) -and `
                 ((docker exec $REDIS_NAME redis-cli ping 2>&1) -match "PONG")
    $apiUp     = try { (Invoke-WebRequest -Uri $HEALTH_URL   -TimeoutSec 2 -EA Stop).StatusCode -eq 200 } catch { $false }
    $webUp     = try { (Invoke-WebRequest -Uri $WEB_URL      -TimeoutSec 2 -EA Stop).StatusCode -lt 500 } catch { $false }
    $workerJob = Get-Job -Name "Workers" -EA SilentlyContinue
    $workerUp  = $workerJob -and ($workerJob.State -eq "Running")

    ServiceRow "Redis"    $redisUp  "localhost:$REDIS_PORT"
    ServiceRow "Backend"  $apiUp    "http://localhost:$API_PORT"
    ServiceRow "Workers"  $workerUp ""
    ServiceRow "Frontend" $webUp    $WEB_URL

    Write-Host ""
    Divider
    Write-Host "  🔗  Quick Links" -ForegroundColor Magenta
    Divider
    Write-Host ""
    Write-Host "  🌐  Home             " -NoNewline; Write-Host "http://localhost:$WEB_PORT"                  -ForegroundColor Cyan
    Write-Host "  📺  Browse Episodes  " -NoNewline; Write-Host "http://localhost:$WEB_PORT/browse"           -ForegroundColor Cyan
    Write-Host "  📊  CMS Dashboard    " -NoNewline; Write-Host "http://localhost:$WEB_PORT/cms/episodes"     -ForegroundColor Cyan
    Write-Host "  📋  Queue Monitor    " -NoNewline; Write-Host "http://localhost:$WEB_PORT/cms/queue"        -ForegroundColor Cyan
    Write-Host "  📈  Analytics        " -NoNewline; Write-Host "http://localhost:$WEB_PORT/cms/analytics"    -ForegroundColor Cyan
    Write-Host "  🔧  API Health       " -NoNewline; Write-Host "http://localhost:$API_PORT/health"           -ForegroundColor Cyan
    Write-Host "  🔑  CMS Login        " -NoNewline; Write-Host "http://localhost:$WEB_PORT/login"            -ForegroundColor Cyan
    Write-Host ""
    Divider
    Write-Host "  📁  Logs  →  $LOG_DIR" -ForegroundColor DarkGray
    Write-Host "       api.log  ·  workers.log  ·  web.log" -ForegroundColor DarkGray
    Write-Host ""
    Divider
    Write-Host "  💡  Press Ctrl+C to stop all services gracefully" -ForegroundColor Yellow
    Write-Host ""
}

# ── Graceful shutdown ────────────────────────────────────────────────────────────
function Stop-All {
    Write-Host ""
    Divider
    Write-Host "  🛑  Stopping all services..." -ForegroundColor Red
    Divider

    foreach ($name in @("API", "Workers", "Web")) {
        $j = Get-Job -Name $name -EA SilentlyContinue
        if ($j) {
            Stop-Job   $j -EA SilentlyContinue
            Remove-Job $j -Force -EA SilentlyContinue
            OK "$name job stopped"
        }
    }

    # Kill any node processes still on our ports
    foreach ($port in @($API_PORT, $WEB_PORT)) {
        (Get-NetTCPConnection -LocalPort $port -EA SilentlyContinue).OwningProcess |
            Sort-Object -Unique |
            ForEach-Object { try { Stop-Process -Id $_ -Force -EA SilentlyContinue } catch {} }
    }

    Warn "Redis container left running.  Run .\stop-all.ps1 to also stop Redis."
    Write-Host ""
    OK "Shutdown complete.  Goodbye 👋"
    Write-Host ""
}

# ── Ctrl+C trap ──────────────────────────────────────────────────────────────────
$null = [Console]::TreatControlCAsInput  # ensure Ctrl+C events fire

# ── MAIN ─────────────────────────────────────────────────────────────────────────
Header

# Create log dir
$null = New-Item -ItemType Directory -Path $LOG_DIR -Force

Assert-Prerequisites
Assert-EnvFile
Install-Deps
Start-Redis
Start-API
Start-Workers
Start-Web

Show-Dashboard

# Open browser
Start-Sleep 2
Step "Opening browser..."
Start-Process $WEB_URL

# Keep-alive loop — detect job crashes, print heartbeat
Write-Host "  👀  Watching services  (Ctrl+C to stop all)..." -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        Start-Sleep 20

        $crashed = @()
        foreach ($entry in @(
            @{Name="API";     Label="Backend API"},
            @{Name="Workers"; Label="Workers"},
            @{Name="Web";     Label="Frontend"}
        )) {
            $j = Get-Job -Name $entry.Name -EA SilentlyContinue
            if ($j -and $j.State -eq "Failed") {
                $crashed += $entry.Label
                Receive-Job $j -EA SilentlyContinue | Select-Object -Last 5 |
                    ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
            }
        }
        if ($crashed.Count -gt 0) {
            Warn "$($crashed -join ', ') crashed.  Check logs in $LOG_DIR"
        }
    }
} finally {
    Stop-All
}
