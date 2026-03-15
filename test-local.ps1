#Requires -Version 5.1
<#
.SYNOPSIS
    AI Animation Factory - Local Test & Start Script
.DESCRIPTION
    Fixes config, starts API + Frontend, runs health checks, shows status.
    Run from project root: .\test-local.ps1
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ROOT    = $PSScriptRoot
$API_DIR = Join-Path $ROOT "apps\api"
$WEB_DIR = Join-Path $ROOT "apps\web"

# ── Colors ───────────────────────────────────────────────────
function OK   { param($m) Write-Host "  [OK]  $m" -ForegroundColor Green }
function FAIL { param($m) Write-Host "  [!!]  $m" -ForegroundColor Red }
function WARN { param($m) Write-Host "  [~~]  $m" -ForegroundColor Yellow }
function INFO { param($m) Write-Host "  [...] $m" -ForegroundColor Cyan }
function HDR  { param($m)
    Write-Host ""
    Write-Host "  ============================================================" -ForegroundColor DarkCyan
    Write-Host "  $m" -ForegroundColor Cyan
    Write-Host "  ============================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

# ── Banner ───────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  +============================================================+" -ForegroundColor Cyan
Write-Host "  |   AI Animation Factory  -  Local Test & Start             |" -ForegroundColor Cyan
Write-Host "  +============================================================+" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host ""

# ── Load .env ────────────────────────────────────────────────
$envVars = @{}
if (Test-Path "$ROOT\.env") {
    Get-Content "$ROOT\.env" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $envVars[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
}

$redisPort = if ($envVars["REDIS_PORT"]) { $envVars["REDIS_PORT"] } else { "6379" }
$redisHost = if ($envVars["REDIS_HOST"]) { $envVars["REDIS_HOST"] } else { "localhost" }
$apiPort   = if ($envVars["API_PORT"])   { $envVars["API_PORT"] }   else { "3001" }

# ============================================================
#  PHASE 1 — PRE-FLIGHT
# ============================================================
HDR "PHASE 1 - Pre-Flight Checks"

# Node
try {
    $nv = node --version 2>&1
    OK "Node.js: $nv"
} catch {
    FAIL "Node.js not found!"
    exit 1
}

# pnpm
try {
    $pv = pnpm --version 2>&1
    OK "pnpm: v$pv"
} catch {
    FAIL "pnpm not found! Run: npm install -g pnpm"
    exit 1
}

# Docker
try {
    $dv = docker --version 2>&1
    OK "Docker: $dv"
} catch {
    WARN "Docker not found (Redis won't start automatically)"
}

# ============================================================
#  PHASE 2 — REDIS
# ============================================================
HDR "PHASE 2 - Redis Check"

INFO "Looking for Redis on ${redisHost}:${redisPort}..."

# Try TCP connect to Redis
$redisOk = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connect = $tcp.BeginConnect($redisHost, [int]$redisPort, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(2000, $false)
    if ($wait -and -not $tcp.Client.Poll(1, [System.Net.Sockets.SelectMode]::SelectError)) {
        $tcp.EndConnect($connect)
        $redisOk = $true
    }
    $tcp.Close()
} catch {}

if ($redisOk) {
    OK "Redis is reachable on port $redisPort"
} else {
    WARN "Redis NOT found on port $redisPort"
    Write-Host ""
    Write-Host "  Trying to start Redis via Docker..." -ForegroundColor Yellow
    $started = docker run -d --name ai-animation-redis -p "${redisPort}:6379" redis:7-alpine 2>&1
    if ($LASTEXITCODE -eq 0) {
        Start-Sleep -Seconds 2
        OK "Redis started on port $redisPort"
        $redisOk = $true
    } else {
        # Maybe already exists
        $restarted = docker start ai-animation-redis 2>&1
        if ($LASTEXITCODE -eq 0) {
            Start-Sleep -Seconds 2
            OK "Existing Redis container restarted"
            $redisOk = $true
        } else {
            FAIL "Could not start Redis. Start it manually:"
            Write-Host "     docker run -d -p ${redisPort}:6379 redis:7-alpine" -ForegroundColor White
        }
    }
}

# ============================================================
#  PHASE 3 — ENV VARIABLES STATUS
# ============================================================
HDR "PHASE 3 - Environment Variables"

$requiredKeys = @(
    "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_ANON_KEY",
    "OPENAI_API_KEY", "JWT_SECRET"
)
$optionalKeys = @(
    "RUNWAY_API_KEY", "ELEVENLABS_API_KEY", "MUBERT_API_KEY",
    "R2_ENDPOINT", "R2_ACCESS_KEY_ID"
)

$placeholderPatterns = @("your-", "sk-your-", "placeholder", "xxxx", "your_")
$missingRequired = @()

foreach ($key in $requiredKeys) {
    $val = $envVars[$key]
    $isPlaceholder = $false
    foreach ($p in $placeholderPatterns) {
        if ($val -like "*$p*") { $isPlaceholder = $true; break }
    }
    if ([string]::IsNullOrEmpty($val) -or $isPlaceholder) {
        WARN "$key = PLACEHOLDER (AI features won't work)"
        $missingRequired += $key
    } else {
        $preview = $val.Substring(0, [Math]::Min(20, $val.Length))
        OK "$key = ${preview}..."
    }
}

Write-Host ""
INFO "Optional API keys:"
foreach ($key in $optionalKeys) {
    $val = $envVars[$key]
    $isPlaceholder = $false
    foreach ($p in $placeholderPatterns) {
        if ($val -like "*$p*") { $isPlaceholder = $true; break }
    }
    if ([string]::IsNullOrEmpty($val) -or $isPlaceholder) {
        Write-Host "  [--]  $key = not set (optional)" -ForegroundColor DarkGray
    } else {
        OK "$key = set"
    }
}

Write-Host ""
if ($missingRequired.Count -gt 0) {
    WARN "$($missingRequired.Count) required key(s) are placeholders."
    WARN "API will start but Supabase/AI calls will fail."
    WARN "The frontend and health endpoint will still work."
} else {
    OK "All required keys are configured"
}

# ============================================================
#  PHASE 4 — INSTALL DEPS (if needed)
# ============================================================
HDR "PHASE 4 - Dependencies"

if (-not (Test-Path "$ROOT\node_modules")) {
    INFO "Installing root dependencies..."
    Set-Location $ROOT
    pnpm install 2>&1 | Out-Null
}
if (-not (Test-Path "$API_DIR\node_modules")) {
    INFO "Installing API dependencies..."
    Set-Location $API_DIR
    pnpm install 2>&1 | Out-Null
}
if (-not (Test-Path "$WEB_DIR\node_modules")) {
    INFO "Installing web dependencies..."
    Set-Location $WEB_DIR
    pnpm install 2>&1 | Out-Null
}

Set-Location $ROOT
OK "All dependencies installed"

# ============================================================
#  PHASE 5 — BUILD SHARED PACKAGE
# ============================================================
HDR "PHASE 5 - Build Shared Package"

$sharedDist = Join-Path $ROOT "packages\shared\dist\index.js"
if (-not (Test-Path $sharedDist)) {
    INFO "Building @ai-animation-factory/shared..."
    Set-Location (Join-Path $ROOT "packages\shared")
    pnpm build 2>&1 | Out-Null
    Set-Location $ROOT
}
OK "Shared package ready"

# ============================================================
#  PHASE 6 — START SERVICES
# ============================================================
HDR "PHASE 6 - Starting Services"

# Kill any existing processes on our ports
INFO "Freeing ports $apiPort and 3000..."
$apiProcs = Get-NetTCPConnection -LocalPort $apiPort -ErrorAction SilentlyContinue |
    Where-Object State -eq Listen |
    Select-Object -ExpandProperty OwningProcess
foreach ($pid in $apiProcs) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}
$webProcs = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
    Where-Object State -eq Listen |
    Select-Object -ExpandProperty OwningProcess
foreach ($pid in $webProcs) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# ── Start API ──────────────────────────────────────────────
INFO "Starting API server (port $apiPort)..."
$apiLog = Join-Path $ROOT "logs\api.log"
New-Item -ItemType Directory -Path (Join-Path $ROOT "logs") -Force | Out-Null

$apiJob = Start-Job -ScriptBlock {
    param($dir, $logFile)
    Set-Location $dir
    $env:NODE_PATH = $dir
    pnpm dev 2>&1 | Out-File -FilePath $logFile -Encoding UTF8
} -ArgumentList $API_DIR, $apiLog

OK "API job started (PID: $($apiJob.Id))"

# ── Start Frontend ─────────────────────────────────────────
INFO "Starting Next.js frontend (port 3000)..."
$webLog = Join-Path $ROOT "logs\web.log"

$webJob = Start-Job -ScriptBlock {
    param($dir, $logFile)
    Set-Location $dir
    pnpm dev 2>&1 | Out-File -FilePath $logFile -Encoding UTF8
} -ArgumentList $WEB_DIR, $webLog

OK "Frontend job started (PID: $($webJob.Id))"

# ── Wait for startup ───────────────────────────────────────
INFO "Waiting 8 seconds for services to initialize..."
for ($i = 8; $i -ge 1; $i--) {
    Write-Host "  $i..." -ForegroundColor DarkGray -NoNewline
    Start-Sleep -Seconds 1
}
Write-Host ""

# ============================================================
#  PHASE 7 — HEALTH CHECKS
# ============================================================
HDR "PHASE 7 - Health Checks"

# Check API
INFO "Testing API health: http://localhost:$apiPort/health"
try {
    $apiRes = Invoke-WebRequest -Uri "http://localhost:$apiPort/health" -TimeoutSec 5 -ErrorAction Stop
    if ($apiRes.StatusCode -eq 200) {
        OK "API is UP (HTTP 200)"
        try {
            $body = $apiRes.Content | ConvertFrom-Json
            INFO "  Status   : $($body.status)"
            INFO "  Uptime   : $([math]::Round($body.uptime, 1))s"
            INFO "  Redis    : $($body.redis)"
            INFO "  Supabase : $($body.supabase)"
        } catch {}
    }
} catch {
    WARN "API not responding yet on port $apiPort"
    INFO "Check logs: logs\api.log"
    # Show last 10 lines of API log
    if (Test-Path $apiLog) {
        Write-Host ""
        Write-Host "  Last API log lines:" -ForegroundColor DarkGray
        Get-Content $apiLog -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
}

# Check Frontend
INFO "Testing frontend: http://localhost:3000"
try {
    $webRes = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    if ($webRes.StatusCode -eq 200) {
        OK "Frontend is UP (HTTP 200)"
    }
} catch {
    WARN "Frontend not responding yet on port 3000"
    INFO "Check logs: logs\web.log"
    if (Test-Path $webLog) {
        Write-Host ""
        Write-Host "  Last web log lines:" -ForegroundColor DarkGray
        Get-Content $webLog -Tail 8 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
    }
}

# Check extra API endpoints
INFO "Testing API routes..."
$routes = @(
    @{ url = "http://localhost:$apiPort/api/test/ping";    name = "Ping" },
    @{ url = "http://localhost:$apiPort/api/test/env";     name = "Env check" },
    @{ url = "http://localhost:$apiPort/api/test/redis";   name = "Redis test" }
)
foreach ($route in $routes) {
    try {
        $r = Invoke-WebRequest -Uri $route.url -TimeoutSec 3 -ErrorAction Stop
        OK "$($route.name): HTTP $($r.StatusCode)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code) {
            WARN "$($route.name): HTTP $code"
        } else {
            Write-Host "  [--]  $($route.name): no response" -ForegroundColor DarkGray
        }
    }
}

# ============================================================
#  PHASE 8 — SUMMARY
# ============================================================
Write-Host ""
Write-Host "  +============================================================+" -ForegroundColor Green
Write-Host "  |   SUMMARY                                                  |" -ForegroundColor Green
Write-Host "  +============================================================+" -ForegroundColor Green
Write-Host ""
Write-Host "    API Server  : http://localhost:$apiPort" -ForegroundColor Cyan
Write-Host "    Health      : http://localhost:$apiPort/health" -ForegroundColor Cyan
Write-Host "    Frontend    : http://localhost:3000" -ForegroundColor Cyan
Write-Host "    Redis       : ${redisHost}:${redisPort}" -ForegroundColor Cyan
Write-Host ""
Write-Host "    Logs:" -ForegroundColor White
Write-Host "      API : $apiLog" -ForegroundColor DarkGray
Write-Host "      Web : $webLog" -ForegroundColor DarkGray
Write-Host ""

if ($missingRequired.Count -gt 0) {
    Write-Host "  !! Missing Keys (edit .env to enable AI):" -ForegroundColor Yellow
    foreach ($k in $missingRequired) {
        Write-Host "     - $k" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "  To stop all services, close this window or run:" -ForegroundColor White
Write-Host "    Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor DarkGray
Write-Host ""

# ============================================================
#  PHASE 9 — INTERACTIVE MENU
# ============================================================
Write-Host "  +------------------------------------------------------------+" -ForegroundColor DarkCyan
Write-Host "  |  QUICK ACTIONS                                             |" -ForegroundColor DarkCyan
Write-Host "  |   1. Open Frontend in browser                             |" -ForegroundColor White
Write-Host "  |   2. Open API health in browser                           |" -ForegroundColor White
Write-Host "  |   3. Show API logs (last 30 lines)                        |" -ForegroundColor White
Write-Host "  |   4. Show Web logs (last 30 lines)                        |" -ForegroundColor White
Write-Host "  |   5. Test: Create episode via API                         |" -ForegroundColor White
Write-Host "  |   6. Open .env in Notepad to add real keys                |" -ForegroundColor White
Write-Host "  |   0. Exit (services keep running)                         |" -ForegroundColor White
Write-Host "  +------------------------------------------------------------+" -ForegroundColor DarkCyan
Write-Host ""

do {
    Write-Host "  Choice [0-6]: " -ForegroundColor Yellow -NoNewline
    $choice = Read-Host

    switch ($choice.Trim()) {
        "1" {
            Start-Process "http://localhost:3000"
            OK "Opened frontend in browser"
        }
        "2" {
            Start-Process "http://localhost:$apiPort/health"
            OK "Opened health endpoint in browser"
        }
        "3" {
            Write-Host ""
            Write-Host "  === API Log (last 30 lines) ===" -ForegroundColor DarkCyan
            if (Test-Path $apiLog) {
                Get-Content $apiLog -Tail 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
            } else {
                WARN "Log file not found: $apiLog"
            }
        }
        "4" {
            Write-Host ""
            Write-Host "  === Web Log (last 30 lines) ===" -ForegroundColor DarkCyan
            if (Test-Path $webLog) {
                Get-Content $webLog -Tail 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
            } else {
                WARN "Log file not found: $webLog"
            }
        }
        "5" {
            INFO "Creating test episode via API..."
            try {
                $body = '{"title":"Test Episode","topic":"AI and the future","style":"cinematic"}'
                $r = Invoke-WebRequest -Uri "http://localhost:$apiPort/api/episodes" `
                    -Method POST `
                    -Body $body `
                    -ContentType "application/json" `
                    -TimeoutSec 5 `
                    -ErrorAction Stop
                OK "Episode created! Response:"
                Write-Host "  $($r.Content)" -ForegroundColor DarkGray
            } catch {
                WARN "Failed: $($_.Exception.Message)"
                INFO "Make sure API is running and Supabase keys are real"
            }
        }
        "6" {
            Start-Process notepad "$ROOT\.env"
            OK "Opened .env in Notepad"
        }
        "0" {
            Write-Host ""
            OK "Exiting menu. Services are still running in background jobs."
            Write-Host "  To stop: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor DarkGray
            Write-Host ""
        }
        default {
            WARN "Invalid choice. Enter 0-6."
        }
    }
} while ($choice.Trim() -ne "0")
