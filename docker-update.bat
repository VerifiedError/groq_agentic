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
git pull origin master
if errorlevel 1 (
    echo [ERROR] Git pull failed
    echo Please check your internet connection and GitHub access
    pause
    exit /b 1
)
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
