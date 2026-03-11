#Requires -Version 5.1
<#
.SYNOPSIS
    AI Animation Factory — Complete Setup & Test Script
.DESCRIPTION
    Runs pre-flight checks, installs dependencies, starts all services,
    executes a full diagnostic test suite, prints a report, and opens an
    interactive control menu.
.NOTES
    Run from the project root:
        .\setup-and-test.ps1
    Bypass execution policy if needed:
        powershell -ExecutionPolicy Bypass -File .\setup-and-test.ps1
#>

# ═══════════════════════════════════════════════════════════════════════════════
#  CONSTANTS & GLOBALS
# ═══════════════════════════════════════════════════════════════════════════════
$ROOT          = $PSScriptRoot
$API_DIR       = Join-Path $ROOT "apps\api"
$WEB_DIR       = Join-Path $ROOT "apps\web"
$LOG_DIR       = Join-Path $ROOT "logs"
$ENV_FILE      = Join-Path $ROOT ".env"
$ENV_EXAMPLE   = Join-Path $ROOT ".env.example"
$SCHEMA_FILE   = Join-Path $ROOT "packages\database\schema.sql"
$STOP_SCRIPT   = Join-Path $ROOT "stop-all.ps1"
$TRANSCRIPT    = Join-Path $ROOT "setup-test-log.txt"

$REDIS_NAME    = "ai-animation-redis"
$REDIS_PORT    = 6379
$API_PORT      = 3001
$WEB_PORT      = 3000
$API_BASE       = "http://localhost:$API_PORT"
$WEB_BASE       = "http://localhost:$WEB_PORT"

# Global result tracking
$script:R = [ordered]@{
    # Phase 1
    EnvFile        = $null   # $true/$false
    EnvKeys        = $null   # $true/$false (no placeholders)
    SchemaConfirmed= $null

    # Phase 2 — services
    Redis          = $false
    BackendAPI     = $false
    Workers        = $false
    Frontend       = $false

    # Phase 3 — tests
    T_ApiHealth    = $null
    T_Supabase     = $null
    T_SchemaReady  = $null
    T_Redis        = $null
    T_Frontend     = $null
    T_QueueStats   = $null
    T_WorkerCount  = 0

    # Phase 3 — API key flags (from /api/test/env)
    K_Supabase     = $null
    K_OpenAI       = $null
    K_Runway       = $null
    K_ElevenLabs   = $null
    K_Mubert       = $null
    K_Storage      = $null
    K_JWT          = $null
}

$script:BackgroundJobs  = @{}
$script:ScriptStartTime = Get-Date

# ═══════════════════════════════════════════════════════════════════════════════
#  UI HELPERS
# ═══════════════════════════════════════════════════════════════════════════════
function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║   🎬  AI Animation Factory  —  Setup & Test Suite           ║" -ForegroundColor Cyan
    Write-Host "  ║   🤖  GPT-4 · DALL-E 3 · Runway · ElevenLabs · Mubert      ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Log file: $TRANSCRIPT" -ForegroundColor DarkGray
    Write-Host "  Started : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
    Write-Host ""
}

function Write-Section {
    param([string]$Title, [string]$Icon = "📌")
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host "  $Icon  $Title" -ForegroundColor Cyan
    Write-Host "  ═══════════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host ""
}

function Write-Sub { param($t) Write-Host "  ── $t" -ForegroundColor DarkCyan }
function Ln        { Write-Host "" }

function W-OK   { param($m) L "  ✅  $m" Green  }
function W-Fail { param($m) L "  ❌  $m" Red    }
function W-Warn { param($m) L "  ⚠️   $m" Yellow }
function W-Step { param($m) L "  ➤  $m"  Cyan   }
function W-Info { param($m) L "  ℹ️   $m"  White  }
function W-Note { param($m) L "  📝  $m"  DarkGray }

function L {
    param([string]$Msg, [string]$Color = "White")
    Write-Host $Msg -ForegroundColor $Color
    $clean = $Msg -replace '[\x00-\x1F]', ''
    Add-Content -Path $TRANSCRIPT -Value "$(Get-Date -Format 'HH:mm:ss')  $clean" -ErrorAction SilentlyContinue
}

function Write-ProgressBar {
    param([int]$Percent, [int]$Width = 40)
    $filled  = [math]::Round($Width * $Percent / 100)
    $empty   = $Width - $filled
    $bar     = "█" * $filled + "░" * $empty
    Write-Host "  [$bar] $Percent%" -ForegroundColor Cyan
}

function Write-ResultRow {
    param([string]$Label, [object]$Value, [string]$Extra = "")
    $pad = $Label.PadRight(26)
    if ($null -eq $Value) {
        Write-Host "  $pad " -NoNewline; Write-Host "─ skipped" -ForegroundColor DarkGray
    } elseif ($Value -eq $true) {
        Write-Host "  $pad " -NoNewline; Write-Host "✅ OK" -ForegroundColor Green -NoNewline
        if ($Extra) { Write-Host "  $Extra" -ForegroundColor DarkGray } else { Write-Host "" }
    } elseif ($Value -eq $false) {
        Write-Host "  $pad " -NoNewline; Write-Host "❌ FAIL" -ForegroundColor Red -NoNewline
        if ($Extra) { Write-Host "  $Extra" -ForegroundColor DarkRed } else { Write-Host "" }
    } else {
        Write-Host "  $pad " -NoNewline; Write-Host $Value -ForegroundColor Yellow
    }
}

function Write-KeyRow {
    param([string]$Label, [object]$IsSet)
    $pad = $Label.PadRight(20)
    if ($null -eq $IsSet)   { Write-Host "  $pad ─ not checked" -ForegroundColor DarkGray }
    elseif ($IsSet -eq $true)  { Write-Host "  $pad " -NoNewline; Write-Host "✅ Configured" -ForegroundColor Green }
    else                       { Write-Host "  $pad " -NoNewline; Write-Host "❌ Missing / placeholder" -ForegroundColor Red }
}

function Prompt-YN {
    param([string]$Question, [string]$Default = "y")
    $hint = if ($Default -eq "y") { "[Y/n]" } else { "[y/N]" }
    $ans  = Read-Host "  $Question $hint"
    if ([string]::IsNullOrWhiteSpace($ans)) { $ans = $Default }
    return $ans -match '^[Yy]'
}

function Invoke-HttpGet {
    param([string]$Url, [int]$TimeoutSec = 8)
    try {
        $r = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return @{ Ok = $true; StatusCode = $r.StatusCode; Body = $r.Content }
    } catch {
        return @{ Ok = $false; StatusCode = 0; Body = $_.Exception.Message }
    }
}

function Invoke-ApiGet {
    param([string]$Path, [int]$TimeoutSec = 10)
    $r = Invoke-HttpGet "$API_BASE$Path" $TimeoutSec
    if ($r.Ok) {
        try { $r.Json = $r.Body | ConvertFrom-Json } catch {}
    }
    return $r
}

# ═══════════════════════════════════════════════════════════════════════════════
#  .ENV HELPERS
# ═══════════════════════════════════════════════════════════════════════════════
$script:EnvMap = $null

function Load-Env {
    $script:EnvMap = @{}
    if (-not (Test-Path $ENV_FILE)) { return }
    foreach ($line in Get-Content $ENV_FILE) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $parts = $line -split '=', 2
        $key   = $parts[0].Trim()
        $val   = if ($parts.Count -gt 1) { $parts[1].Trim() } else { "" }
        $script:EnvMap[$key] = $val
    }
}

function Get-Env { param([string]$Key); return $script:EnvMap[$Key] }

function Test-EnvSet {
    param([string]$Key)
    $v = Get-Env $Key
    if ([string]::IsNullOrWhiteSpace($v)) { return $false }
    if ($v -match '(your-|your_|sk-your|placeholder|xxxx|example\.com|zzz)') { return $false }
    return $true
}

$PLACEHOLDER_PATTERNS = @(
    'your-project\.supabase\.co',
    'your-service-role-key',
    'your-anon-key',
    'your-account-id',
    'your-r2-access-key',
    'your-r2-secret-key',
    'your-openai-key',
    'sk-your-openai',
    'your-runway-key',
    'your-elevenlabs-key',
    'your-mubert-key',
    'your-mubert-license',
    'your-super-secret-jwt',
    'pub-xxxx\.r2\.dev',
    'your-sentry-dsn'
)

function Test-HasPlaceholders {
    if (-not (Test-Path $ENV_FILE)) { return $false }
    $raw = Get-Content $ENV_FILE -Raw
    foreach ($pat in $PLACEHOLDER_PATTERNS) {
        if ($raw -imatch $pat) { return $true }
    }
    return $false
}

function Get-MissingRequiredKeys {
    $required = @(
        'SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
        'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME',
        'ELEVENLABS_API_KEY',
        'JWT_SECRET'
    )
    return $required | Where-Object { -not (Test-EnvSet $_) }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  SERVICE HELPERS
# ═══════════════════════════════════════════════════════════════════════════════
function Wait-ForUrl {
    param(
        [string]$Url,
        [string]$Label,
        [int]$MaxSeconds    = 90,
        [int]$IntervalSec   = 2,
        [int]$ExpectStatus  = 200
    )
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $dots = 0
    while ($sw.Elapsed.TotalSeconds -lt $MaxSeconds) {
        Start-Sleep $IntervalSec
        $dots++
        $pct = [math]::Min(99, [math]::Round($sw.Elapsed.TotalSeconds / $MaxSeconds * 100))
        Write-Progress -Activity "Waiting for $Label" -Status "$([math]::Round($sw.Elapsed.TotalSeconds))s / ${MaxSeconds}s" -PercentComplete $pct
        try {
            $r = Invoke-WebRequest -Uri $Url -TimeoutSec 4 -UseBasicParsing -EA Stop
            if ($r.StatusCode -lt 500) {
                Write-Progress -Activity "Waiting for $Label" -Completed
                return $true
            }
        } catch {}
    }
    Write-Progress -Activity "Waiting for $Label" -Completed
    return $false
}

function Start-BackgroundService {
    param([string]$Name, [string]$WorkDir, [string]$Command, [string]$LogFile)
    $existing = Get-Job -Name $Name -ErrorAction SilentlyContinue
    if ($existing) {
        Stop-Job  $existing -EA SilentlyContinue
        Remove-Job $existing -Force -EA SilentlyContinue
    }
    $job = Start-Job -Name $Name -ScriptBlock {
        param($d, $l, $c)
        Set-Location $d
        $env:NODE_ENV = "development"
        Invoke-Expression $c 2>&1 | Tee-Object -FilePath $l -Append
    } -ArgumentList $WorkDir, $LogFile, $Command
    $script:BackgroundJobs[$Name] = $job.Id
    return $job
}

function Free-Port {
    param([int]$Port, [string]$Label)
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $conns) { return }
    W-Warn "Port $Port ($Label) is occupied — releasing it..."
    $conns.OwningProcess | Sort-Object -Unique | ForEach-Object {
        try { Stop-Process -Id $_ -Force -EA SilentlyContinue } catch {}
    }
    Start-Sleep 1
    if (Get-NetTCPConnection -LocalPort $Port -EA SilentlyContinue) {
        W-Fail "Could not free port $Port.  Stop the occupying process manually."
        exit 1
    }
    W-OK "Port $Port is now free"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 1 — PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════════════════════
function Phase1-PreFlight {
    Write-Section "PHASE 1 — Pre-Flight Checks" "🔍"

    # ── 1.1 Node.js ─────────────────────────────────────────────────────────────
    Write-Sub "Node.js"
    if (-not (Get-Command node -EA SilentlyContinue)) {
        W-Fail "Node.js not found.  Download v18+ from https://nodejs.org"
        exit 1
    }
    $nodeVer = [int]((node --version) -replace 'v','').Split('.')[0]
    if ($nodeVer -lt 18) {
        W-Fail "Node.js v18+ required (found v$nodeVer).  Please upgrade."
        exit 1
    }
    W-OK "Node.js $(node --version)"

    # ── 1.2 pnpm ────────────────────────────────────────────────────────────────
    Write-Sub "pnpm"
    if (-not (Get-Command pnpm -EA SilentlyContinue)) {
        W-Warn "pnpm not found — installing..."
        npm install -g pnpm 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { W-Fail "Could not install pnpm.  Run: npm install -g pnpm"; exit 1 }
        W-OK "pnpm installed"
    } else { W-OK "pnpm $(pnpm --version)" }

    # ── 1.3 Docker ──────────────────────────────────────────────────────────────
    Write-Sub "Docker"
    if (-not (Get-Command docker -EA SilentlyContinue)) {
        W-Fail "Docker not found."
        W-Info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
        W-Warn "Continuing without Docker — Redis will be unavailable."
        $script:NoDocker = $true
    } else {
        $script:NoDocker = $false
        W-OK "Docker $(docker --version 2>&1 | Select-String '\d+\.\d+\.\d+' | ForEach-Object { $_.Matches[0].Value })"
    }

    # ── 1.4 .env file ───────────────────────────────────────────────────────────
    Write-Sub ".env file"
    if (-not (Test-Path $ENV_FILE)) {
        if (Test-Path $ENV_EXAMPLE) {
            Copy-Item $ENV_EXAMPLE $ENV_FILE
            W-Warn ".env was missing — copied from .env.example"
            $script:R.EnvFile = $false
        } else {
            W-Fail ".env and .env.example both missing.  Re-clone the repository."
            exit 1
        }
    } else {
        W-OK ".env file exists"
        $script:R.EnvFile = $true
    }

    Load-Env

    # ── 1.5 Check for placeholder values ────────────────────────────────────────
    Write-Sub "API key configuration"
    $missing = Get-MissingRequiredKeys
    $hasPlaceholders = Test-HasPlaceholders

    if ($missing.Count -gt 0 -or $hasPlaceholders) {
        $script:R.EnvKeys = $false
        Write-Host ""
        Write-Host "  ┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Red
        Write-Host "  │  ⚠️  CRITICAL WARNING — API Keys Not Configured              │" -ForegroundColor Red
        Write-Host "  │                                                              │" -ForegroundColor Red
        Write-Host "  │  The following required keys are missing or still have       │" -ForegroundColor Red
        Write-Host "  │  placeholder values in your .env file:                       │" -ForegroundColor Red
        Write-Host "  │                                                              │" -ForegroundColor Red
        foreach ($key in $missing) {
            Write-Host "  │    ❌  $($key.PadRight(46))│" -ForegroundColor Yellow
        }
        Write-Host "  │                                                              │" -ForegroundColor Red
        Write-Host "  │  The system will start but AI generation WILL FAIL           │" -ForegroundColor Red
        Write-Host "  │  until real keys are provided.                               │" -ForegroundColor Red
        Write-Host "  └──────────────────────────────────────────────────────────────┘" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Where to get each key:" -ForegroundColor White
        Write-Host "    SUPABASE_URL / _SERVICE_KEY / _ANON_KEY  →  https://app.supabase.com → Project Settings → API" -ForegroundColor DarkGray
        Write-Host "    OPENAI_API_KEY                           →  https://platform.openai.com/api-keys" -ForegroundColor DarkGray
        Write-Host "    R2_* keys                                →  Cloudflare Dashboard → R2 → Manage API tokens" -ForegroundColor DarkGray
        Write-Host "    ELEVENLABS_API_KEY                       →  https://elevenlabs.io → Profile → API Keys" -ForegroundColor DarkGray
        Write-Host "    JWT_SECRET                               →  any random 32+ character string" -ForegroundColor DarkGray
        Write-Host ""

        if (-not (Prompt-YN "Have you already added real API keys to .env?")) {
            W-Step "Opening .env in Notepad..."
            Start-Process notepad $ENV_FILE -Wait
            Load-Env
            $stillMissing = Get-MissingRequiredKeys
            if ($stillMissing.Count -gt 0) {
                W-Warn "Still missing: $($stillMissing -join ', ')"
                W-Warn "Continuing anyway — some tests will fail."
            } else {
                W-OK "All required keys are now set"
                $script:R.EnvKeys = $true
            }
        } else {
            W-Warn "Continuing with current .env — some tests may fail if keys are invalid."
        }
    } else {
        $script:R.EnvKeys = $true
        W-OK "All required .env keys appear to be set"
    }

    # ── 1.6 Supabase schema ──────────────────────────────────────────────────────
    Write-Sub "Supabase database schema"
    Write-Host ""
    Write-Host "  The API requires PostgreSQL tables to exist in your Supabase project." -ForegroundColor White
    Write-Host "  If this is your first run, you must execute schema.sql." -ForegroundColor White
    Write-Host ""
    Write-Host "  How to run the schema:" -ForegroundColor Cyan
    Write-Host "    1. Open https://app.supabase.com" -ForegroundColor White
    Write-Host "    2. Select your project" -ForegroundColor White
    Write-Host "    3. Click 'SQL Editor' in the left sidebar" -ForegroundColor White
    Write-Host "    4. Click '+ New query'" -ForegroundColor White
    Write-Host "    5. Paste the contents of: packages\database\schema.sql" -ForegroundColor Yellow
    Write-Host "    6. Click 'Run'" -ForegroundColor White
    Write-Host ""

    if (Test-Path $SCHEMA_FILE) {
        W-Info "Schema file found at: $SCHEMA_FILE"
        if (Prompt-YN "Open schema.sql in Notepad so you can copy it?") {
            Start-Process notepad $SCHEMA_FILE
            W-Info "Opened schema.sql — copy all contents and paste into Supabase SQL Editor."
        }
    }

    $script:R.SchemaConfirmed = Prompt-YN "Have you run schema.sql in Supabase (or it was already run)?"
    if ($script:R.SchemaConfirmed) {
        W-OK "Schema confirmed by user"
    } else {
        W-Warn "Schema not confirmed — Supabase tests will likely fail."
        W-Warn "You can still proceed; run the schema before triggering generation."
    }

    # ── 1.7 node_modules ────────────────────────────────────────────────────────
    Write-Sub "Dependencies"
    $apiMods = Join-Path $API_DIR "node_modules"
    $webMods = Join-Path $WEB_DIR "node_modules"

    if (-not (Test-Path $apiMods) -or -not (Test-Path $webMods)) {
        W-Step "Running pnpm install (first run — up to 3 minutes)..."
        Push-Location $ROOT
        pnpm install 2>&1 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor DarkGray
            Add-Content $TRANSCRIPT "    $_" -EA SilentlyContinue
        }
        if ($LASTEXITCODE -ne 0) { W-Fail "pnpm install failed"; Pop-Location; exit 1 }
        Pop-Location
        W-OK "Dependencies installed"
    } else {
        W-OK "node_modules present"
    }

    Ln
    W-OK "Phase 1 complete"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 2 — START SERVICES
# ═══════════════════════════════════════════════════════════════════════════════
function Phase2-StartServices {
    Write-Section "PHASE 2 — Starting Services" "🚀"

    $null = New-Item -ItemType Directory -Path $LOG_DIR -Force

    # ── 2.1 Stop existing services ───────────────────────────────────────────────
    Write-Sub "Stopping any previously running services"
    if (Test-Path $STOP_SCRIPT) {
        W-Step "Calling stop-all.ps1..."
        & $STOP_SCRIPT 2>&1 | Out-Null
        Start-Sleep 2
        W-OK "Previous services stopped"
    } else {
        # Kill jobs and free ports manually
        foreach ($n in @("API","Workers","Web","BackendAPI","Frontend")) {
            $j = Get-Job -Name $n -EA SilentlyContinue
            if ($j) { Stop-Job $j -EA SilentlyContinue; Remove-Job $j -Force -EA SilentlyContinue }
        }
        foreach ($p in @($API_PORT, $WEB_PORT)) { Free-Port $p "service" }
    }
    Ln

    # ── 2.2 Redis ─────────────────────────────────────────────────────────────
    Write-Sub "Redis  (Docker)"
    if ($script:NoDocker) {
        W-Warn "Docker unavailable — skipping Redis"
    } else {
        # Ensure daemon is running
        $null = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            W-Warn "Docker daemon not running — starting Docker Desktop..."
            $exe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            if (Test-Path $exe) { Start-Process $exe }
            W-Step "Waiting up to 90 s for Docker Desktop..."
            for ($i = 0; $i -lt 30; $i++) {
                Start-Sleep 3
                $null = docker info 2>&1
                if ($LASTEXITCODE -eq 0) { W-OK "Docker is ready"; break }
                Write-Host "    ... $($i*3+3) s" -ForegroundColor DarkGray
            }
            $null = docker info 2>&1
            if ($LASTEXITCODE -ne 0) { W-Fail "Docker did not start.  Open Docker Desktop manually."; exit 1 }
        }

        $running = docker ps --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
        if ($running -eq $REDIS_NAME) {
            W-OK "Redis already running (container: $REDIS_NAME)"
        } else {
            $exists = docker ps -a --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
            if ($exists -eq $REDIS_NAME) {
                W-Step "Restarting stopped Redis container..."
                docker start $REDIS_NAME 2>&1 | Out-Null
            } else {
                W-Step "Creating Redis container (redis:7-alpine, port $REDIS_PORT)..."
                docker run -d `
                    --name $REDIS_NAME `
                    --restart unless-stopped `
                    -p "${REDIS_PORT}:6379" `
                    redis:7-alpine `
                    redis-server --appendonly yes 2>&1 | Out-Null
            }
            if ($LASTEXITCODE -ne 0) { W-Fail "Failed to start Redis.  Check Docker logs."; exit 1 }

            # Wait for PONG
            W-Step "Waiting for Redis readiness..."
            $ok = $false
            for ($i = 0; $i -lt 15; $i++) {
                Start-Sleep 1
                if ((docker exec $REDIS_NAME redis-cli ping 2>&1) -match "PONG") { $ok = $true; break }
            }
            if ($ok) { W-OK "Redis ready  (port $REDIS_PORT)" }
            else     { W-Fail "Redis did not respond"; exit 1 }
        }
        $script:R.Redis = $true
    }
    Ln

    # ── 2.3 Backend API ──────────────────────────────────────────────────────────
    Write-Sub "Backend API  (port $API_PORT)"
    Free-Port $API_PORT "Backend API"
    $apiLog = Join-Path $LOG_DIR "api.log"
    Start-BackgroundService "API" $API_DIR "pnpm dev" $apiLog | Out-Null
    W-Step "Waiting for API to respond at $API_BASE/health..."
    $apiUp = Wait-ForUrl "$API_BASE/health" "Backend API" -MaxSeconds 60
    if ($apiUp) { W-OK "Backend API is up  → $API_BASE"; $script:R.BackendAPI = $true }
    else        { W-Warn "Backend API did not respond within 60 s.  Check logs\api.log" }
    Ln

    # ── 2.4 Workers ──────────────────────────────────────────────────────────────
    Write-Sub "Workers  (9 queues)"
    $workerLog = Join-Path $LOG_DIR "workers.log"
    Start-BackgroundService "Workers" $API_DIR "pnpm worker" $workerLog | Out-Null
    Start-Sleep 5
    $wj = Get-Job -Name "Workers" -EA SilentlyContinue
    if ($wj -and $wj.State -eq "Running") {
        W-OK "Workers running"
        $script:R.Workers = $true
    } else {
        W-Warn "Workers job is in state '$($wj.State)'.  Check logs\workers.log"
    }
    Ln

    # ── 2.5 Frontend ─────────────────────────────────────────────────────────────
    Write-Sub "Frontend  (port $WEB_PORT)"
    Free-Port $WEB_PORT "Frontend"
    $webLog = Join-Path $LOG_DIR "web.log"
    Start-BackgroundService "Web" $WEB_DIR "pnpm dev" $webLog | Out-Null
    W-Step "Waiting for Next.js to compile (up to 90 s)..."
    $webUp = Wait-ForUrl $WEB_BASE "Frontend" -MaxSeconds 90
    if ($webUp) { W-OK "Frontend is up  → $WEB_BASE"; $script:R.Frontend = $true }
    else        { W-Warn "Frontend did not respond within 90 s.  Check logs\web.log" }
    Ln

    W-OK "Phase 2 complete"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 3 — SYSTEM TESTS
# ═══════════════════════════════════════════════════════════════════════════════
function Run-Test {
    param([string]$Name, [string]$Url, [scriptblock]$Validate)
    Write-Host "  Testing $Name..." -NoNewline -ForegroundColor Cyan
    $r = Invoke-ApiGet $Url
    $ok = & $Validate $r
    if ($ok) { Write-Host " ✅ PASS" -ForegroundColor Green }
    else      { Write-Host " ❌ FAIL" -ForegroundColor Red }
    if (-not $r.Ok) {
        W-Note "   HTTP error: $($r.Body)"
        # Show last 5 lines of API log for context
        $apiLog = Join-Path $LOG_DIR "api.log"
        if (Test-Path $apiLog) {
            W-Note "   Last lines from api.log:"
            Get-Content $apiLog -Tail 5 | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkRed }
        }
    }
    return $ok
}

function Phase3-RunTests {
    Write-Section "PHASE 3 — System Tests" "🧪"

    if (-not $script:R.BackendAPI) {
        W-Warn "Backend API is not running — skipping most tests."
        W-Warn "Fix API startup errors (check logs\api.log) then re-run."
        return
    }

    # ── Test 1: API Health ───────────────────────────────────────────────────────
    Write-Sub "Test 1 / 6 — API Health Check"
    $r1 = Invoke-ApiGet "/health"
    if ($r1.Ok -and $r1.Body -match '"status"') {
        W-OK "GET /health  →  $($r1.Body.Substring(0, [math]::Min(80,$r1.Body.Length)))"
        $script:R.T_ApiHealth = $true
    } else {
        W-Fail "GET /health failed  →  $($r1.Body)"
        $script:R.T_ApiHealth = $false
    }
    Ln

    # ── Test 2: Supabase Connection ──────────────────────────────────────────────
    Write-Sub "Test 2 / 6 — Supabase Connection"
    $r2 = Invoke-ApiGet "/api/test/supabase"
    if ($r2.Ok -and $r2.Json) {
        $script:R.T_Supabase    = [bool]$r2.Json.connected
        $script:R.T_SchemaReady = [bool]$r2.Json.schema_ready
        if ($r2.Json.connected)   { W-OK "Connected to Supabase  (latency: $($r2.Json.latency_ms) ms)" }
        else                      { W-Fail "Cannot reach Supabase: $($r2.Json.message)" }
        if ($r2.Json.schema_ready){ W-OK "Database schema is in place" }
        else                      { W-Warn "Schema tables missing: $($r2.Json.message)" }
    } else {
        W-Fail "GET /api/test/supabase failed  →  $($r2.Body)"
        $script:R.T_Supabase = $false
    }
    Ln

    # ── Test 3: Redis Connection ─────────────────────────────────────────────────
    Write-Sub "Test 3 / 6 — Redis Connection"
    $r3 = Invoke-ApiGet "/api/test/redis"
    if ($r3.Ok -and $r3.Json -and $r3.Json.success) {
        W-OK "Redis PONG received  (latency: $($r3.Json.latency_ms) ms)"
        $script:R.T_Redis = $true
    } else {
        $msg = if ($r3.Json) { $r3.Json.message } else { $r3.Body }
        W-Fail "Redis unreachable: $msg"
        W-Info "Fix: Ensure Docker is running and container '$REDIS_NAME' exists."
        W-Info "     docker start $REDIS_NAME"
        $script:R.T_Redis = $false
    }
    Ln

    # ── Test 4: Frontend Loading ─────────────────────────────────────────────────
    Write-Sub "Test 4 / 6 — Frontend"
    $r4 = Invoke-HttpGet $WEB_BASE
    if ($r4.Ok -and $r4.StatusCode -ge 200 -and $r4.StatusCode -lt 500) {
        W-OK "Frontend returned HTTP $($r4.StatusCode)  →  $WEB_BASE"
        $script:R.T_Frontend = $true
    } else {
        W-Fail "Frontend not reachable (HTTP $($r4.StatusCode))"
        W-Info "Check logs\web.log for Next.js compile errors."
        $script:R.T_Frontend = $false
    }
    Ln

    # ── Test 5: API Key Status ───────────────────────────────────────────────────
    Write-Sub "Test 5 / 6 — API Key Configuration"
    $r5 = Invoke-ApiGet "/api/test/env"
    if ($r5.Ok -and $r5.Json -and $r5.Json.keys) {
        $k = $r5.Json.keys
        $script:R.K_Supabase   = [bool]$k.supabase
        $script:R.K_OpenAI     = [bool]$k.openai
        $script:R.K_Runway     = [bool]$k.runway
        $script:R.K_ElevenLabs = [bool]$k.elevenlabs
        $script:R.K_Mubert     = [bool]$k.mubert
        $script:R.K_Storage    = [bool]$k.storage_r2
        $script:R.K_JWT        = [bool]$k.jwt

        $allSet = $k.supabase -and $k.openai -and $k.runway -and $k.elevenlabs -and $k.storage_r2 -and $k.jwt
        if ($allSet) { W-OK "All API keys appear to be configured" }
        else         { W-Warn "Some API keys are missing — generation will fail for those services." }
    } else {
        W-Warn "Could not verify API keys (endpoint unavailable)"
        W-Info "Ensure apps/api/src/routes/test.routes.ts is registered in server.ts"
    }
    Ln

    # ── Test 6: Workers & Queue ──────────────────────────────────────────────────
    Write-Sub "Test 6 / 6 — Workers & Queue Stats"
    $r6 = Invoke-ApiGet "/api/test/queue-stats"
    if ($r6.Ok -and $r6.Json -and $r6.Json.success) {
        $s = $r6.Json.summary
        $script:R.T_QueueStats  = $true
        $script:R.T_WorkerCount = [int]$s.total_workers

        W-OK "Queue infrastructure reachable"
        Write-Host "    Total queues:    $($s.total_queues)"    -ForegroundColor White
        Write-Host "    Active workers:  $($s.total_workers)"   -ForegroundColor $(if ($s.total_workers -gt 0) { "Green" } else { "Yellow" })
        Write-Host "    Active jobs:     $($s.total_active)"    -ForegroundColor White
        Write-Host "    Waiting jobs:    $($s.total_waiting)"   -ForegroundColor White
        Write-Host "    Completed jobs:  $($s.total_completed)" -ForegroundColor White
        Write-Host "    Failed jobs:     $($s.total_failed)"    -ForegroundColor $(if ($s.total_failed -gt 0) { "Red" } else { "White" })

        if ($s.total_workers -eq 0) {
            W-Warn "No active workers detected."
            W-Info "Workers register with queues only when a job is processed."
            W-Info "This is normal if no jobs have been dispatched yet."
        }

        # Per-queue breakdown
        Write-Host ""
        Write-Host "  Queue Breakdown:" -ForegroundColor DarkCyan
        Write-Host "  $("Queue".PadRight(20)) $("Workers".PadRight(10)) Active  Waiting  Failed" -ForegroundColor DarkGray
        foreach ($q in $r6.Json.queues) {
            $wColor = if ($q.worker_count -gt 0) { "Green" } else { "DarkGray" }
            $fColor = if ($q.failed -gt 0) { "Red" } else { "White" }
            Write-Host "  $($q.name.PadRight(20)) " -NoNewline
            Write-Host "$($q.worker_count.ToString().PadRight(10))" -NoNewline -ForegroundColor $wColor
            Write-Host "$($q.active.ToString().PadRight(8))" -NoNewline
            Write-Host "$($q.waiting.ToString().PadRight(9))" -NoNewline
            Write-Host "$($q.failed)" -ForegroundColor $fColor
        }
    } else {
        $msg = if ($r6.Json) { $r6.Json.message } else { $r6.Body }
        W-Warn "Queue stats unavailable: $msg"
        W-Info "Workers may still be initializing.  Re-run tests in a moment."
        $script:R.T_QueueStats = $false
    }
    Ln

    W-OK "Phase 3 complete"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 4 — REPORT
# ═══════════════════════════════════════════════════════════════════════════════
function Phase4-Report {
    Write-Section "PHASE 4 — Setup Report" "📊"

    $elapsed = [math]::Round(((Get-Date) - $script:ScriptStartTime).TotalSeconds)
    Write-Host "  Completed in $elapsed seconds  ·  $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
    Ln

    # ── Services ─────────────────────────────────────────────────────────────────
    Write-Host "  SERVICE STATUS" -ForegroundColor Magenta
    Write-Host "  $("─"*55)" -ForegroundColor DarkGray
    Write-ResultRow "Redis"          $script:R.Redis       "port $REDIS_PORT"
    Write-ResultRow "Backend API"    $script:R.BackendAPI  "http://localhost:$API_PORT"
    Write-ResultRow "Workers"        $script:R.Workers     "($($script:R.T_WorkerCount) active connections)"
    Write-ResultRow "Frontend"       $script:R.Frontend    "http://localhost:$WEB_PORT"
    Ln

    # ── Database ──────────────────────────────────────────────────────────────────
    Write-Host "  DATABASE" -ForegroundColor Magenta
    Write-Host "  $("─"*55)" -ForegroundColor DarkGray
    Write-ResultRow "Supabase Connect"   $script:R.T_Supabase
    Write-ResultRow "Schema Tables"      $script:R.T_SchemaReady
    Ln

    # ── API Keys ──────────────────────────────────────────────────────────────────
    Write-Host "  API KEYS" -ForegroundColor Magenta
    Write-Host "  $("─"*55)" -ForegroundColor DarkGray
    Write-KeyRow "Supabase"     $script:R.K_Supabase
    Write-KeyRow "OpenAI"       $script:R.K_OpenAI
    Write-KeyRow "Runway ML"    $script:R.K_Runway
    Write-KeyRow "ElevenLabs"   $script:R.K_ElevenLabs
    Write-KeyRow "Mubert"       $script:R.K_Mubert
    Write-KeyRow "Storage (R2)" $script:R.K_Storage
    Write-KeyRow "JWT Secret"   $script:R.K_JWT
    Ln

    # ── Test Results ──────────────────────────────────────────────────────────────
    Write-Host "  TEST RESULTS" -ForegroundColor Magenta
    Write-Host "  $("─"*55)" -ForegroundColor DarkGray
    Write-ResultRow "API Health"         $script:R.T_ApiHealth
    Write-ResultRow "Supabase Query"     $script:R.T_Supabase
    Write-ResultRow "Redis Ping"         $script:R.T_Redis
    Write-ResultRow "Frontend HTTP"      $script:R.T_Frontend
    Write-ResultRow "Queue Stats"        $script:R.T_QueueStats
    Ln

    # ── Overall score ─────────────────────────────────────────────────────────────
    $critical = @(
        $script:R.Redis,   $script:R.BackendAPI, $script:R.Frontend,
        $script:R.T_ApiHealth, $script:R.T_Redis, $script:R.T_Frontend
    )
    $passCount = ($critical | Where-Object { $_ -eq $true }).Count
    $totalCount = $critical.Count
    $pct        = [math]::Round($passCount / $totalCount * 100)

    Ln
    Write-ProgressBar $pct
    Write-Host ""
    if ($pct -eq 100)    { W-OK  "All checks passed — system is fully operational! 🎉" }
    elseif ($pct -ge 60) { W-Warn "Partial success ($pct%) — review failures above before generating episodes." }
    else                 { W-Fail "Major issues detected ($pct%) — fix errors before using the system." }
    Ln

    # ── Write log ─────────────────────────────────────────────────────────────────
    W-Note "Full log saved to: $TRANSCRIPT"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 5 — NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════════
function Phase5-NextSteps {
    Write-Section "PHASE 5 — Next Steps" "🗺️"

    $allGreen = $script:R.BackendAPI -and $script:R.Frontend -and
                $script:R.T_Supabase -and $script:R.T_Redis

    if ($allGreen) {
        Write-Host "  🎉  System is READY!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Your stack is running.  Here is what to do next:" -ForegroundColor White
        Write-Host ""
        Write-Host "  1. Open the app         →  " -NoNewline; Write-Host $WEB_BASE -ForegroundColor Cyan
        Write-Host "  2. Log in to the CMS    →  " -NoNewline; Write-Host "$WEB_BASE/login" -ForegroundColor Cyan
        Write-Host "     (Create a user in Supabase 'users' table first)" -ForegroundColor DarkGray
        Write-Host "  3. Go to Queue Monitor  →  " -NoNewline; Write-Host "$WEB_BASE/cms/queue" -ForegroundColor Cyan
        Write-Host "  4. Click 'Generate Episode' to create your first AI episode" -ForegroundColor White
        Write-Host "  5. Watch it appear in   →  " -NoNewline; Write-Host "$WEB_BASE/browse" -ForegroundColor Cyan
        Ln
    } else {
        Write-Host "  🔧  Issues need to be resolved:" -ForegroundColor Yellow
        Ln

        if (-not $script:R.BackendAPI) {
            Write-Host "  ❌  Backend API is not running" -ForegroundColor Red
            Write-Host "     • Check logs\api.log for TypeScript/startup errors" -ForegroundColor White
            Write-Host "     • Ensure all SUPABASE_* keys in .env are valid" -ForegroundColor White
            Write-Host "     • Run manually: cd apps\api && pnpm dev" -ForegroundColor DarkGray
            Ln
        }
        if (-not $script:R.T_Supabase) {
            Write-Host "  ❌  Supabase not connected" -ForegroundColor Red
            Write-Host "     • Verify SUPABASE_URL and SUPABASE_SERVICE_KEY in .env" -ForegroundColor White
            Write-Host "     • Check your Supabase project is not paused" -ForegroundColor White
            Write-Host "     • Ensure IP is not blocked in Supabase network settings" -ForegroundColor White
            Ln
        }
        if ($script:R.T_Supabase -and -not $script:R.T_SchemaReady) {
            Write-Host "  ❌  Database schema not applied" -ForegroundColor Red
            Write-Host "     • Open https://app.supabase.com → SQL Editor" -ForegroundColor White
            Write-Host "     • Paste + run: packages\database\schema.sql" -ForegroundColor Yellow
            Ln
        }
        if (-not $script:R.T_Redis) {
            Write-Host "  ❌  Redis not reachable" -ForegroundColor Red
            Write-Host "     • Ensure Docker Desktop is running" -ForegroundColor White
            Write-Host "     • Run: docker start $REDIS_NAME" -ForegroundColor DarkGray
            Write-Host "     • Or create: docker run -d --name $REDIS_NAME -p 6379:6379 redis:7-alpine" -ForegroundColor DarkGray
            Ln
        }
        if (-not $script:R.Frontend) {
            Write-Host "  ❌  Frontend is not running" -ForegroundColor Red
            Write-Host "     • Check logs\web.log for Next.js errors" -ForegroundColor White
            Write-Host "     • Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set" -ForegroundColor White
            Write-Host "     • Run manually: cd apps\web && pnpm dev" -ForegroundColor DarkGray
            Ln
        }
        if ($script:R.EnvKeys -eq $false) {
            Write-Host "  ⚠️   Some API keys missing" -ForegroundColor Yellow
            Write-Host "     • AI generation will fail without OpenAI, Runway, ElevenLabs keys" -ForegroundColor White
            Write-Host "     • Edit .env and re-run this script" -ForegroundColor White
            Ln
        }
    }

    Write-Host "  Quick Reference URLs:" -ForegroundColor DarkCyan
    Write-Host "  ┌──────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │  Frontend        $("$WEB_BASE".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  CMS Dashboard   $("$WEB_BASE/cms/episodes".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  Queue Monitor   $("$WEB_BASE/cms/queue".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  Analytics       $("$WEB_BASE/cms/analytics".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  CMS Login       $("$WEB_BASE/login".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  API Health      $("$API_BASE/health".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  Supabase Test   $("$API_BASE/api/test/supabase".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  Redis Test      $("$API_BASE/api/test/redis".PadRight(43))│" -ForegroundColor White
    Write-Host "  │  Queue Stats     $("$API_BASE/api/test/queue-stats".PadRight(43))│" -ForegroundColor White
    Write-Host "  └──────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
    Ln
}

# ═══════════════════════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS FOR MENU
# ═══════════════════════════════════════════════════════════════════════════════
function Open-Url { param([string]$Url); Start-Process $Url; W-OK "Opened $Url" }

function Show-Logs {
    Write-Section "Log Files" "📝"
    $logs = @(
        @{ Name = "API Server";  File = "api.log"     },
        @{ Name = "Workers";     File = "workers.log" },
        @{ Name = "Frontend";    File = "web.log"      },
        @{ Name = "Setup/Test";  File = "..\setup-test-log.txt" }
    )
    foreach ($log in $logs) {
        $path = Join-Path $LOG_DIR $log.File
        $full = [System.IO.Path]::GetFullPath($path)
        Write-Host "  $($log.Name.PadRight(14))  $full" -ForegroundColor Cyan
        if (Test-Path $full) {
            Write-Host "  Last 10 lines:" -ForegroundColor DarkGray
            Get-Content $full -Tail 10 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        } else {
            Write-Host "  (file not found)" -ForegroundColor DarkGray
        }
        Ln
    }
    $choice = Read-Host "  Press ENTER to return to menu"
}

function Stop-AllServices {
    Write-Section "Stopping All Services" "🛑"
    if (Test-Path $STOP_SCRIPT) {
        W-Step "Running stop-all.ps1..."
        & $STOP_SCRIPT
    } else {
        foreach ($n in @("API","Workers","Web")) {
            $j = Get-Job -Name $n -EA SilentlyContinue
            if ($j) {
                Stop-Job  $j -EA SilentlyContinue
                Remove-Job $j -Force -EA SilentlyContinue
                W-OK "$n stopped"
            }
        }
        if (-not $script:NoDocker) {
            $running = docker ps --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
            if ($running -eq $REDIS_NAME) {
                docker stop $REDIS_NAME 2>&1 | Out-Null
                W-OK "Redis stopped"
            }
        }
    }
    W-OK "All services stopped"
}

function Rerun-Tests {
    Write-Section "Re-running Tests" "🔄"
    Load-Env
    Phase3-RunTests
    Phase4-Report
}

function Show-ServiceStatus {
    Write-Section "Current Service Status" "📡"

    $redisOk  = if (-not $script:NoDocker) {
        (docker ps --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1) -eq $REDIS_NAME
    } else { $false }

    $apiOk    = try { (Invoke-WebRequest -Uri "$API_BASE/health" -TimeoutSec 3 -EA Stop).StatusCode -eq 200 } catch { $false }
    $webOk    = try { (Invoke-WebRequest -Uri $WEB_BASE -TimeoutSec 3 -EA Stop).StatusCode -lt 500 } catch { $false }
    $wJob     = Get-Job -Name "Workers" -EA SilentlyContinue
    $workerOk = $wJob -and $wJob.State -eq "Running"

    Write-ResultRow "Redis"     $redisOk  "localhost:$REDIS_PORT"
    Write-ResultRow "Backend"   $apiOk    "http://localhost:$API_PORT"
    Write-ResultRow "Workers"   $workerOk ""
    Write-ResultRow "Frontend"  $webOk    "http://localhost:$WEB_PORT"
    Ln
    Read-Host "  Press ENTER to return to menu" | Out-Null
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PHASE 6 — INTERACTIVE MENU
# ═══════════════════════════════════════════════════════════════════════════════
function Phase6-Menu {
    do {
        Write-Host ""
        Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
        Write-Host "  ║   🎬  AI Animation Factory  —  Control Menu                ║" -ForegroundColor Cyan
        Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
        Write-Host ""

        # Quick status line
        $apiOk = try { (Invoke-WebRequest -Uri "$API_BASE/health" -TimeoutSec 2 -EA Stop).StatusCode -eq 200 } catch { $false }
        $webOk = try { (Invoke-WebRequest -Uri $WEB_BASE -TimeoutSec 2 -EA Stop).StatusCode -lt 500 } catch { $false }
        $apiStatus = if ($apiOk) { "🟢 API" } else { "🔴 API" }
        $webStatus = if ($webOk) { "🟢 Web" } else { "🔴 Web" }
        Write-Host "  Status: $apiStatus  ·  $webStatus  ·  $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
        Write-Host ""

        Write-Host "  ┌──────────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
        Write-Host "  │  1.  🌐  Open Frontend             (http://localhost:3000)  │" -ForegroundColor White
        Write-Host "  │  2.  📊  Open CMS Dashboard        (.../cms/episodes)       │" -ForegroundColor White
        Write-Host "  │  3.  📋  Open Queue Monitor        (.../cms/queue)          │" -ForegroundColor White
        Write-Host "  │  4.  📈  Open Analytics            (.../cms/analytics)      │" -ForegroundColor White
        Write-Host "  │  5.  🔧  Open API Health           (http://localhost:3001)  │" -ForegroundColor White
        Write-Host "  │  ──────────────────────────────────────────────────────────  │" -ForegroundColor DarkGray
        Write-Host "  │  6.  🔄  Re-run All Tests                                   │" -ForegroundColor White
        Write-Host "  │  7.  📡  Check Service Status                               │" -ForegroundColor White
        Write-Host "  │  8.  📝  View Log Files                                     │" -ForegroundColor White
        Write-Host "  │  ──────────────────────────────────────────────────────────  │" -ForegroundColor DarkGray
        Write-Host "  │  9.  🚀  Restart All Services                               │" -ForegroundColor White
        Write-Host "  │  10. 🛑  Stop All Services                                  │" -ForegroundColor White
        Write-Host "  │  ──────────────────────────────────────────────────────────  │" -ForegroundColor DarkGray
        Write-Host "  │  0.  ❌  Exit (services keep running)                       │" -ForegroundColor White
        Write-Host "  └──────────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
        Write-Host ""

        $choice = Read-Host "  Enter your choice [0-10]"

        switch ($choice.Trim()) {
            "1"  { Open-Url $WEB_BASE }
            "2"  { Open-Url "$WEB_BASE/cms/episodes" }
            "3"  { Open-Url "$WEB_BASE/cms/queue" }
            "4"  { Open-Url "$WEB_BASE/cms/analytics" }
            "5"  { Open-Url "$API_BASE/health" }
            "6"  { Rerun-Tests }
            "7"  { Show-ServiceStatus }
            "8"  { Show-Logs }
            "9"  {
                Write-Host "  Restarting services..." -ForegroundColor Yellow
                Stop-AllServices
                Start-Sleep 3
                Phase2-StartServices
                Phase4-Report
            }
            "10" {
                Stop-AllServices
                W-OK "All services stopped.  Run .\start.ps1 to start again."
            }
            "0"  {
                Ln
                W-OK "Exiting menu.  Services are still running in the background."
                W-Info "To stop them: .\stop-all.ps1"
                Ln
            }
            default {
                W-Warn "Invalid choice '$choice' — enter a number between 0 and 10"
            }
        }

    } while ($choice.Trim() -ne "0" -and $choice.Trim() -ne "10")
}

# ═══════════════════════════════════════════════════════════════════════════════
#  SHUTDOWN HOOK
# ═══════════════════════════════════════════════════════════════════════════════
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    foreach ($n in @("API","Workers","Web")) {
        $j = Get-Job -Name $n -ErrorAction SilentlyContinue
        if ($j) { Stop-Job $j -EA SilentlyContinue; Remove-Job $j -Force -EA SilentlyContinue }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════
try {
    # Start transcript
    $null = New-Item -ItemType Directory -Path $LOG_DIR -Force -ErrorAction SilentlyContinue
    Start-Transcript -Path $TRANSCRIPT -Append -Force -ErrorAction SilentlyContinue

    Show-Banner

    Phase1-PreFlight
    Phase2-StartServices
    Phase3-RunTests
    Phase4-Report
    Phase5-NextSteps
    Phase6-Menu

} catch {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "  ║   💥  UNEXPECTED ERROR                                      ║" -ForegroundColor Red
    Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Stack trace:" -ForegroundColor DarkGray
    Write-Host "  $($_.ScriptStackTrace)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  The full log is saved to: $TRANSCRIPT" -ForegroundColor Yellow
    Write-Host "  Please include this file when reporting issues." -ForegroundColor Yellow
    Write-Host ""
} finally {
    Stop-Transcript -ErrorAction SilentlyContinue

    if ($Host.Name -eq "ConsoleHost" -and -not $env:CI) {
        Write-Host "  Press any key to close..." -ForegroundColor DarkGray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}
