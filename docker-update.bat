@echo off
REM One-Click Docker Update Script
REM This script pulls latest code and rebuilds Docker containers

echo ========================================
echo Groq Agentic - Docker Update
echo ========================================
echo.
echo This will:
echo 1. Pull latest code from GitHub
echo 2. Stop running containers
echo 3. Rebuild Docker image from scratch
echo 4. Apply all database migrations
echo 5. Start fresh containers
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop first
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Step 1: Pull latest code
echo ========================================
echo [1/5] Pulling latest code from GitHub...
echo ========================================

REM Check if this is a git repository
if not exist ".git" (
    echo [ERROR] This directory is not a git repository
    echo Please clone the repository first
    pause
    exit /b 1
)

REM Check for uncommitted changes
echo Checking for local changes...
git status --porcelain > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git status check failed
    pause
    exit /b 1
)

REM Stash any local changes before pulling
git status --porcelain > git_status.tmp
for %%A in (git_status.tmp) do set /a size=%%~zA
del git_status.tmp
if %size% GTR 0 (
    echo [WARNING] Found local changes. Stashing them...
    git stash push -m "Auto-stash before docker-update.bat at %date% %time%"
    if errorlevel 1 (
        echo [ERROR] Failed to stash local changes
        echo Please commit or discard your changes manually
        pause
        exit /b 1
    )
    set STASHED=1
) else (
    set STASHED=0
)

REM Pull latest code from GitHub
echo Pulling latest code from origin/master...
git pull origin master
if errorlevel 1 (
    echo [ERROR] Git pull failed
    echo Please check your internet connection and GitHub access
    if %STASHED%==1 (
        echo Restoring your stashed changes...
        git stash pop
    )
    pause
    exit /b 1
)

REM Restore stashed changes if any
if %STASHED%==1 (
    echo Restoring your local changes...
    git stash pop
    if errorlevel 1 (
        echo [WARNING] Could not restore stashed changes automatically
        echo Your changes are saved in the stash. Run 'git stash list' to see them
    )
)

echo [SUCCESS] Code updated successfully
echo.

REM Step 2: Stop containers
echo ========================================
echo [2/5] Stopping containers...
echo ========================================
docker-compose down
if errorlevel 1 (
    echo [WARNING] No containers to stop (may not be running)
)
echo.

REM Step 3: Rebuild image
echo ========================================
echo [3/5] Rebuilding Docker image...
echo This may take 5-10 minutes
echo ========================================
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo.

REM Step 4: Start containers
echo ========================================
echo [4/5] Starting containers...
echo ========================================
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)
echo.

REM Step 5: Wait and check logs
echo ========================================
echo [5/5] Waiting for application to start...
echo ========================================
timeout /t 5 >nul
echo.

echo [SUCCESS] Update complete!
echo.
echo Checking migration status...
echo ========================================
docker-compose logs | findstr /C:"migration" /C:"Ready in" /C:"ERROR"
echo ========================================
echo.

echo Application is running at:
echo http://localhost:13381
echo.
echo Opening browser...
timeout /t 3 >nul
start http://localhost:13381
echo.

echo Press any key to view live logs (or close this window)
pause >nul
docker-compose logs -f
