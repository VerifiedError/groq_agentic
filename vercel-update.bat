@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Vercel Update Script
REM One-click deployment to Vercel
REM ========================================

echo.
echo ========================================
echo   VERCEL UPDATE - AGENTIC PROJECT
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not a git repository
    echo Please run this script from the project root
    pause
    exit /b 1
)

echo [1/6] Checking git status...
echo.

REM Get current branch
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a
echo Current branch: %CURRENT_BRANCH%
echo.

REM Check for uncommitted changes
git diff-index --quiet HEAD --
if errorlevel 1 (
    echo [!] You have uncommitted changes:
    echo.
    git status --short
    echo.

    set /p COMMIT_CHOICE="Do you want to commit these changes? (y/n): "
    if /i not "!COMMIT_CHOICE!"=="y" (
        echo.
        echo [INFO] Deployment cancelled. Please commit or stash your changes.
        pause
        exit /b 0
    )

    echo.
    set /p COMMIT_MSG="Enter commit message: "
    if "!COMMIT_MSG!"=="" (
        echo [ERROR] Commit message cannot be empty
        pause
        exit /b 1
    )

    echo.
    echo [2/6] Staging all changes...
    git add .

    echo [3/6] Committing changes...
    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 (
        echo [ERROR] Failed to commit changes
        pause
        exit /b 1
    )
    echo [SUCCESS] Changes committed
) else (
    echo [SUCCESS] No uncommitted changes
)

echo.
echo [4/6] Pushing to GitHub...
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo.
    echo Common issues:
    echo - No remote named 'origin'
    echo - Authentication failed (check SSH keys or token)
    echo - Network connection issues
    pause
    exit /b 1
)
echo [SUCCESS] Pushed to GitHub: %CURRENT_BRANCH%

echo.
echo [5/6] Vercel Deployment Status...
echo.
echo The push to GitHub will automatically trigger a Vercel deployment.
echo.
echo Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app
echo.
echo Vercel will:
echo   1. Detect the push to %CURRENT_BRANCH%
echo   2. Install dependencies (npm install)
echo   3. Run Prisma migrations
echo   4. Build the project (npm run build)
echo   5. Deploy to production
echo.
echo Expected deployment time: ~2-3 minutes
echo.

REM Check if gh CLI is installed for deployment tracking
gh --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] GitHub CLI not installed - cannot track deployment
    echo Install from: https://cli.github.com/
    echo.
    echo You can monitor deployment at:
    echo https://vercel.com/verifiederrors-projects/agentic
) else (
    echo [6/6] Opening Vercel dashboard...
    echo.
    set /p OPEN_DASHBOARD="Open Vercel dashboard in browser? (y/n): "
    if /i "!OPEN_DASHBOARD!"=="y" (
        start https://vercel.com/verifiederrors-projects/agentic
    )
)

echo.
echo ========================================
echo   DEPLOYMENT INITIATED SUCCESSFULLY
echo ========================================
echo.
echo Next steps:
echo   1. Monitor deployment at: https://vercel.com/verifiederrors-projects/agentic
echo   2. Check deployment logs for any errors
echo   3. Test production site after deployment completes
echo.
echo Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app
echo.

pause
