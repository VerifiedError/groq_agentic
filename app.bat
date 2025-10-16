@echo off
echo Starting Agentic on port 13380...

REM Check if port 13380 is in use
echo Checking port 13380...
set "KILLED_PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :13380 ^| findstr LISTENING') do (
    if not defined KILLED_PID (
        echo Found process %%a using port 13380
        echo Terminating process %%a...
        powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
        echo Process terminated.
        set "KILLED_PID=%%a"
        timeout /t 2 /nobreak >nul
    )
)

echo Port 13380 is now available.
npm run dev -- -p 13380
