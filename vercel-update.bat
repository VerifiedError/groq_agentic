@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   VERCEL UPDATE - AGENTIC PROJECT
echo ========================================
echo.

git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed
    pause
    exit /b 1
)

git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository
    pause
    exit /b 1
)

echo [INFO] Running PowerShell version of script...
echo.
powershell -ExecutionPolicy Bypass -File vercel-update.ps1
