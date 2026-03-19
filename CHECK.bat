@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              Checking All Services Status                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

PowerShell -ExecutionPolicy Bypass -File "%~dp0check-status.ps1"
