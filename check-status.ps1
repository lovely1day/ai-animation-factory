#!/usr/bin/env pwsh
# AI Animation Factory - Health Check
# ====================================

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║              🔍 AI Animation Factory - Health Check           ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

$services = @(
    @{ Name = "Web Frontend"; Url = "http://localhost:3000"; Port = 3000 },
    @{ Name = "API Server"; Url = "http://localhost:3001/api/health"; Port = 3001 },
    @{ Name = "Ollama"; Url = "http://localhost:11434/api/tags"; Port = 11434 },
    @{ Name = "Redis"; Url = "localhost"; Port = 6379; IsPort = $true }
)

$allHealthy = $true

foreach ($service in $services) {
    Write-Host "`nChecking $($service.Name)..." -ForegroundColor Yellow
    
    try {
        if ($service.IsPort) {
            # Check Redis via port
            $result = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue
            if ($result.TcpTestSucceeded) {
                Write-Host "   ✅ $($service.Name) is running (port $($service.Port))" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $($service.Name) is NOT running" -ForegroundColor Red
                $allHealthy = $false
            }
        } else {
            # Check HTTP endpoints
            $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            $statusCode = $response.StatusCode
            
            if ($statusCode -eq 200) {
                Write-Host "   ✅ $($service.Name) is healthy (HTTP $statusCode)" -ForegroundColor Green
                
                # Show additional info for API
                if ($service.Name -eq "API Server") {
                    try {
                        $apiStatus = Invoke-RestMethod -Uri $service.Url -TimeoutSec 5
                        Write-Host "      Status: $($apiStatus.status)" -ForegroundColor DarkGray
                    } catch {}
                }
                
                # Show models for Ollama
                if ($service.Name -eq "Ollama") {
                    try {
                        $ollamaStatus = Invoke-RestMethod -Uri $service.Url -TimeoutSec 5
                        Write-Host "      Models: $($ollamaStatus.models.name -join ', ')" -ForegroundColor DarkGray
                    } catch {}
                }
            } else {
                Write-Host "   ⚠️  $($service.Name) returned HTTP $statusCode" -ForegroundColor DarkYellow
            }
        }
    } catch {
        Write-Host "   ❌ $($service.Name) is NOT responding: $($_.Exception.Message)" -ForegroundColor Red
        $allHealthy = $false
    }
}

# Summary
Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "✅ All services are running!" -ForegroundColor Green
    Write-Host "`n🌐 Open http://localhost:3000 to start using Idea Generator" -ForegroundColor Green
} else {
    Write-Host "❌ Some services are not running. Run .\start-all.ps1 to start them." -ForegroundColor Red
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Quick actions
Write-Host "`n📋 Quick Actions:" -ForegroundColor Yellow
Write-Host "   1. Start all services: .\start-all.ps1" -ForegroundColor White
Write-Host "   2. Stop all services:  .\stop-all.ps1" -ForegroundColor White
Write-Host "   3. View logs:          Get-Content .\logs\api.log -Tail 20" -ForegroundColor White
