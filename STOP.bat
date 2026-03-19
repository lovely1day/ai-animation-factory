@echo off
chcp 65001 >nul
PowerShell -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"
