#!/usr/bin/env pwsh
# ============================================================
#   ALI'S AI WORKSPACE — Master Startup Script
#   All ports defined in PORTS.ps1 — do not change them elsewhere
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# Load port definitions
. "$PSScriptRoot\PORTS.ps1"

# Paths — Projects
$animationFactory = "C:\ALI_WORKSPACE\01_PROJECTS\ai-animation-factory"
$mediavorice      = "C:\ALI_WORKSPACE\01_PROJECTS\mediavorice-studio\mediavorice-studio"
$comfyUI          = "$animationFactory\ComfyUI"

# Paths — Shared Library (08_LIBRARY) — single source for all Python envs
$lib              = "C:\ALI_WORKSPACE\08_LIBRARY"

# audio_env: XTTS v2 + Whisper + edge-tts + FastAPI
$audioEnvPy       = "$lib\audio_env\venv\Scripts\python.exe"

# comfyUI: uses its own venv until image_env is rebuilt
$comfyEnvPy       = "$comfyUI\venv\Scripts\python.exe"

# MediaVoice Python — from 08_LIBRARY/audio_env or fallback to old venv
$mediavoriceEnv   = if (Test-Path $audioEnvPy) { $audioEnvPy } else { "$mediavorice\venv\Scripts\python.exe" }

# ── Helpers ──────────────────────────────────────────────────

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  +====================================================+" -ForegroundColor Cyan
    Write-Host "  |       ALI'S AI WORKSPACE  --  MASTER STARTUP       |" -ForegroundColor Cyan
    Write-Host "  +====================================================+" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Port {
    param($Port)
    $c = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $c
}

# Kill any process using the port before starting
function Clear-Port {
    param($Port, $Name)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  [WARN]  Port $Port busy ($($proc.ProcessName)) -- freeing..." -ForegroundColor DarkYellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 800
            Write-Host "  [OK]    Port $Port is now free" -ForegroundColor DarkGreen
        }
    }
}

function Start-Window {
    param($Title, $Command, $WorkDir)
    Start-Process powershell.exe `
        -ArgumentList "-NoExit", "-Command", "& { `$Host.UI.RawUI.WindowTitle='$Title'; $Command }" `
        -WorkingDirectory $WorkDir
}

function Show-Status {
    param($Name, $Port, $Url)
    Start-Sleep -Milliseconds 2000
    if (Test-Port $Port) {
        Write-Host "  [OK]  $Name" -ForegroundColor Green -NoNewline
        Write-Host "  -->  $Url" -ForegroundColor DarkGray
    } else {
        Write-Host "  [..] $Name  (starting on port $Port...)" -ForegroundColor Yellow
    }
}

# ════════════════════════════════════════════════════════════
Write-Header

Write-Host "  Fixed Ports:" -ForegroundColor DarkCyan
Write-Host "  Web:$($PORTS.WebApp)  |  API:$($PORTS.ApiServer)  |  Redis:$($PORTS.Redis)  |  ComfyUI:$($PORTS.ComfyUI)  |  MediaVoice:$($PORTS.MediaVoice)" -ForegroundColor DarkGray
Write-Host ""

# ── 1. REDIS (Windows Service) ───────────────────────────────
Write-Host "  [1/5]  Redis  (port $($PORTS.Redis))..." -ForegroundColor White
$redis = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
if ($redis -and $redis.Status -eq "Running") {
    Write-Host "  [OK]  Redis  -->  localhost:$($PORTS.Redis)  (service)" -ForegroundColor Green
} else {
    try {
        Start-Service -Name "Redis" -ErrorAction Stop
        Write-Host "  [OK]  Redis started" -ForegroundColor Green
    } catch {
        Write-Host "  [ERR] Redis service not found" -ForegroundColor Red
    }
}
Write-Host ""

# ── 2. COMFYUI (port 8188) ────────────────────────────────────
Write-Host "  [2/5]  ComfyUI  (port $($PORTS.ComfyUI))..." -ForegroundColor White
Clear-Port $PORTS.ComfyUI "ComfyUI"
$comfyCmd = "cd '$comfyUI'; Write-Host 'ComfyUI starting on port $($PORTS.ComfyUI)...' -ForegroundColor Cyan; & '$comfyEnvPy' main.py --port $($PORTS.ComfyUI) --listen"
Start-Window -Title "ComfyUI :$($PORTS.ComfyUI)" -Command $comfyCmd -WorkDir $comfyUI
Show-Status "ComfyUI" $PORTS.ComfyUI $URLS.ComfyUI
Write-Host ""

# ── 3. MEDIAVORICE STUDIO (port 8000) ─────────────────────────
Write-Host "  [3/5]  MediaVoice Studio  (port $($PORTS.MediaVoice))..." -ForegroundColor White
Clear-Port $PORTS.MediaVoice "MediaVoice"
$voiceCmd = "cd '$mediavorice\backend'; `$env:PATH += ';C:\ffmpeg\bin'; Write-Host 'MediaVoice starting on port $($PORTS.MediaVoice)...' -ForegroundColor Cyan; & '$mediavoriceEnv' -m uvicorn main:app --host 0.0.0.0 --port $($PORTS.MediaVoice)"
Start-Window -Title "MediaVoice :$($PORTS.MediaVoice)" -Command $voiceCmd -WorkDir "$mediavorice\backend"
Show-Status "MediaVoice Studio" $PORTS.MediaVoice $URLS.MediaDocs
Write-Host ""

# ── 4. API SERVER (port 3001) ──────────────────────────────────
Write-Host "  [4/5]  API Server  (port $($PORTS.ApiServer))..." -ForegroundColor White
Clear-Port $PORTS.ApiServer "API"
$apiCmd = "cd '$animationFactory'; Write-Host 'API Server starting on port $($PORTS.ApiServer)...' -ForegroundColor Cyan; pnpm --filter api dev"
Start-Window -Title "API Server :$($PORTS.ApiServer)" -Command $apiCmd -WorkDir $animationFactory
Show-Status "API Server" $PORTS.ApiServer $URLS.ApiHealth
Write-Host ""

# ── 5. WEB APP (port 3000) ─────────────────────────────────────
Write-Host "  [5/5]  Web App  (port $($PORTS.WebApp))..." -ForegroundColor White
Clear-Port $PORTS.WebApp "Web"
$webCmd = "cd '$animationFactory'; Write-Host 'Web App starting on port $($PORTS.WebApp)...' -ForegroundColor Cyan; pnpm --filter web dev"
Start-Window -Title "Web App :$($PORTS.WebApp)" -Command $webCmd -WorkDir $animationFactory
Show-Status "Web App" $PORTS.WebApp $URLS.WebApp
Write-Host ""

# ════════════════════════════════════════════════════════════
Write-Host "  +====================================================+" -ForegroundColor Cyan
Write-Host "  |              ALL SERVICES STARTED!                 |" -ForegroundColor Cyan
Write-Host "  +====================================================+" -ForegroundColor Cyan
Write-Host "  |  Web App       -->  $($URLS.WebApp)" -ForegroundColor White
Write-Host "  |  API Server    -->  $($URLS.ApiHealth)" -ForegroundColor White
Write-Host "  |  MediaVoice   -->  $($URLS.MediaDocs)" -ForegroundColor White
Write-Host "  |  ComfyUI       -->  $($URLS.ComfyUI)" -ForegroundColor White
Write-Host "  |  Redis         -->  localhost:$($PORTS.Redis)" -ForegroundColor White
Write-Host "  +====================================================+" -ForegroundColor Cyan
Write-Host "  Optional: run 'ollama serve' for local LLM" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Wait ~15 seconds for all services to finish starting..." -ForegroundColor Yellow
Write-Host ""
