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
echo 5. Clean rebuild (if having issues)
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
echo http://localhost:13380
echo.
echo Useful commands:
echo - View logs: docker-compose logs -f
echo - Stop app: docker-compose down
echo - Restart: docker-compose restart
echo.
echo Opening browser...
timeout /t 3 >nul
start http://localhost:13380
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
echo Cleaning and rebuilding...
echo ========================================
echo Stopping containers...
docker-compose down
echo Removing images...
docker-compose build --no-cache
echo Starting containers...
docker-compose up -d
echo [OK] Clean rebuild complete
goto end

:end
echo.
pause
