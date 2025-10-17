@echo off
REM Quick Start Script for Docker Deployment (Windows)

echo ========================================
echo Groq Agentic - Docker Quick Start
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local file not found
    echo.
    echo Creating .env.local from template...
    if exist .env.local.template (
        copy .env.local.template .env.local >nul
        echo [OK] .env.local created from template
        echo.
        echo IMPORTANT: Please edit .env.local and add your GROQ_API_KEY
        echo 1. Open .env.local in a text editor
        echo 2. Replace 'gsk_your_api_key_here' with your actual API key
        echo 3. Replace the NEXTAUTH_SECRET with a random string
        echo.
        echo Opening .env.local in notepad...
        start notepad .env.local
        echo.
        echo Press any key after saving your changes...
        pause >nul
    ) else (
        echo [ERROR] .env.local.template not found
        echo Please create .env.local manually
        pause
        exit /b 1
    )
)

echo [OK] .env.local exists
echo.

REM Ask user if they want to build or just start
echo Choose an option:
echo 1. Build and start (first time or after code changes)
echo 2. Just start (if already built)
echo 3. Stop containers
echo 4. View logs
echo 5. Clean rebuild (if having database/migration issues)
echo.
echo NOTE: Use option 5 if you see "table does not exist" errors
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto build_and_start
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto clean_rebuild
echo Invalid choice
pause
exit /b 1

:build_and_start
echo.
echo ========================================
echo Building Docker image...
echo This may take 5-10 minutes first time
echo ========================================
docker-compose build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build successful
goto start

:start
echo.
echo ========================================
echo Starting containers...
echo ========================================
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Application is running!
echo.
echo Access your application at:
echo http://localhost:13381
echo.
echo Useful commands:
echo - View logs: docker-compose logs -f
echo - Stop app: docker-compose down
echo - Restart: docker-compose restart
echo.
echo TROUBLESHOOTING:
echo If you see "table does not exist" errors:
echo 1. Stop this script (Ctrl+C)
echo 2. Run docker-start.bat again
echo 3. Choose option 5 (Clean rebuild)
echo.
echo Opening browser...
timeout /t 3 >nul
start http://localhost:13381
goto end

:stop
echo.
echo ========================================
echo Stopping containers...
echo ========================================
docker-compose down
echo [OK] Containers stopped
goto end

:logs
echo.
echo ========================================
echo Viewing logs (Press Ctrl+C to exit)
echo ========================================
docker-compose logs -f
goto end

:clean_rebuild
echo.
echo ========================================
echo Clean Rebuild (with database migrations)
echo ========================================
echo.
echo This will:
echo 1. Stop all containers
echo 2. Rebuild Docker image from scratch
echo 3. Deploy database migrations
echo 4. Start fresh containers
echo.
echo This fixes "table does not exist" errors!
echo.
pause
echo.
echo [1/4] Stopping containers...
docker-compose down
if errorlevel 1 (
    echo [WARNING] Failed to stop containers (may not be running)
)
echo.
echo [2/4] Rebuilding Docker image (this may take 5-10 minutes)...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo.
echo [3/4] Starting containers...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)
echo.
echo [4/4] Waiting for application to start...
timeout /t 5 >nul
echo.
echo [SUCCESS] Clean rebuild complete!
echo.
echo Checking logs for migration status...
echo ========================================
docker-compose logs | findstr /C:"migration" /C:"Ready in" /C:"ERROR"
echo ========================================
echo.
echo Full logs will now be displayed (Press Ctrl+C to exit)
echo.
timeout /t 3 >nul
docker-compose logs -f
goto end

:end
echo.
pause
