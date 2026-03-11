#Requires -Version 5.1
<#
.SYNOPSIS
    AI Animation Factory - Stop All Services
.DESCRIPTION
    Gracefully stops the Frontend, Backend API, Workers, and Redis container.
.NOTES
    Run from the project root:  .\stop-all.ps1
    To bypass execution policy:  powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
#>

$REDIS_NAME = "ai-animation-redis"
$API_PORT   = 3001
$WEB_PORT   = 3000

# ── UI ─────────────────────────────────────────────────────────────────────────
function Divider  { Write-Host "  ─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray }
function OK($m)   { Write-Host "  ✅  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ⚠️   $m" -ForegroundColor Yellow }
function Step($m) { Write-Host "  ➤  $m" -ForegroundColor Cyan }
function Info($m) { Write-Host "  ℹ️   $m" -ForegroundColor White }

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "  ║    🛑   AI Animation Factory  —  Stop All Services          ║" -ForegroundColor Red
Write-Host "  ╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""
Divider

# ── 1. Stop PowerShell background jobs (start.ps1 jobs) ────────────────────────
Write-Host "  [1/4]  PowerShell background jobs" -ForegroundColor Magenta
Divider

$jobNames = @("API", "Workers", "Web", "BackendAPI", "Frontend")
$stopped  = 0
foreach ($name in $jobNames) {
    $j = Get-Job -Name $name -ErrorAction SilentlyContinue
    if ($j) {
        Step "Stopping PS job '$name' (state: $($j.State))..."
        Stop-Job   $j -ErrorAction SilentlyContinue
        Remove-Job $j -Force -ErrorAction SilentlyContinue
        OK "Job '$name' removed"
        $stopped++
    }
}
if ($stopped -eq 0) { Info "No background jobs found" }
Write-Host ""

# ── 2. Kill Node.js processes on our ports ──────────────────────────────────────
Write-Host "  [2/4]  Node.js processes on ports $API_PORT / $WEB_PORT" -ForegroundColor Magenta
Divider

$killedPids = @()
foreach ($port in @($API_PORT, $WEB_PORT)) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $pid  = $conn.OwningProcess
        if ($pid -in $killedPids) { continue }
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Step "Killing  PID $pid  ($($proc.ProcessName))  on port $port..."
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                OK "PID $pid stopped"
                $killedPids += $pid
            }
        } catch {
            Warn "Could not kill PID $pid — $($_.Exception.Message)"
        }
    }
}
if ($killedPids.Count -eq 0) { Info "No processes found on ports $API_PORT or $WEB_PORT" }
Write-Host ""

# ── 3. Kill any other node.exe processes spawned by pnpm ───────────────────────
Write-Host "  [3/4]  Remaining node / tsx processes" -ForegroundColor Magenta
Divider

# Narrow scope: only kill node processes whose command-line mentions our project dir
$projectRoot = $PSScriptRoot -replace '\\','/'
$nodeProcs = Get-WmiObject Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
$killed2   = 0
foreach ($p in $nodeProcs) {
    $cmdLine = $p.CommandLine
    if ($cmdLine -and ($cmdLine -match [regex]::Escape("ai-animation-factory") -or
                       $cmdLine -match "apps.api" -or
                       $cmdLine -match "apps.web"  -or
                       $cmdLine -match "tsx"        -or
                       $cmdLine -match "next-server")) {
        Step "Stopping node.exe  PID $($p.ProcessId)..."
        try {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
            OK "PID $($p.ProcessId) stopped"
            $killed2++
        } catch {
            Warn "Could not stop PID $($p.ProcessId)"
        }
    }
}
if ($killed2 -eq 0) { Info "No project-related node.exe processes found" }
Write-Host ""

# ── 4. Stop / leave Redis ───────────────────────────────────────────────────────
Write-Host "  [4/4]  Redis Docker container" -ForegroundColor Magenta
Divider

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Info "Docker not installed — skipping Redis"
} else {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Info "Docker daemon not running — nothing to stop"
    } else {
        $running = docker ps --filter "name=^/${REDIS_NAME}$" --format "{{.Names}}" 2>&1
        if ($running -eq $REDIS_NAME) {
            Step "Stopping Redis container '$REDIS_NAME'..."
            docker stop $REDIS_NAME 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                OK "Redis stopped  (container preserved for next start)"
            } else {
                Warn "docker stop returned a non-zero exit code"
            }
        } else {
            Info "Redis container '$REDIS_NAME' is not running"
        }
    }
}

Write-Host ""
Divider
Write-Host ""
Write-Host "  ✅  All services stopped." -ForegroundColor Green
Write-Host ""
Write-Host "  To start again:" -ForegroundColor White
Write-Host "    PowerShell launcher  →  .\start.ps1" -ForegroundColor Cyan
Write-Host "    Quick batch file     →  double-click QUICK-START.bat" -ForegroundColor Cyan
Write-Host ""
Divider
Write-Host ""

# Pause so the window stays open if double-clicked
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "  Press any key to close..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
