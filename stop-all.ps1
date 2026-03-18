#!/usr/bin/env pwsh
# ============================================================
#   ALI'S AI WORKSPACE — Master Stop Script
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# تحميل البورتات المثبتة
. "$PSScriptRoot\PORTS.ps1"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "  ║        ALI'S AI WORKSPACE  —  STOPPING ALL           ║" -ForegroundColor Yellow
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

function Stop-Port {
    param($Port, $Name)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅  $Name  (port $Port) — stopped" -ForegroundColor Green
        }
    } else {
        Write-Host "  ➖  $Name  (port $Port) — was not running" -ForegroundColor DarkGray
    }
}

Stop-Port $PORTS.WebApp     "Web App"
Stop-Port $PORTS.ApiServer  "API Server"
Stop-Port $PORTS.MediaVoice "MediaVoice Studio"
Stop-Port $PORTS.ComfyUI    "ComfyUI"

# أغلق نوافذ الـ PowerShell التي فتحناها
Write-Host ""
Write-Host "  إغلاق نوافذ الخدمات..." -ForegroundColor White
Get-Process powershell | Where-Object {
    $_.MainWindowTitle -match "(:3000|:3001|:8000|:8188|API Server|Web App|MediaVoice|ComfyUI)"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║          تم إيقاف جميع الخدمات                        ║" -ForegroundColor Green
Write-Host "  ║  Redis لا يزال يعمل (Windows Service)                 ║" -ForegroundColor DarkGray
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
