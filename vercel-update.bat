@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Vercel Update Script
REM One-click deployment to Vercel via CLI
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

echo [1/7] Checking git status...
echo.

REM Get current branch
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a
echo Current branch: %CURRENT_BRANCH%
echo.

REM Check for uncommitted changes
git diff-index --quiet HEAD -- >nul 2>&1
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
    echo [2/7] Staging all changes...
    git add .

    echo [3/7] Committing changes...
    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 (
        echo [ERROR] Failed to commit changes
        pause
        exit /b 1
    )
    echo [SUCCESS] Changes committed
    echo.
) else (
    echo [SUCCESS] No uncommitted changes
    echo.
)

echo [4/7] Pushing to GitHub...
git push origin %CURRENT_BRANCH% >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo.
    echo Common issues:
    echo - No remote named 'origin'
    echo - Authentication failed (check SSH keys or token)
    echo - Network connection issues
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] Pushed to GitHub: %CURRENT_BRANCH%
echo.

REM Check if Vercel CLI is installed
echo [5/7] Checking Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Vercel CLI is not installed
    echo.
    echo To install Vercel CLI:
    echo   npm install -g vercel
    echo.
    echo Alternatively, visit: https://vercel.com/docs/cli
    echo.
    echo Falling back to GitHub auto-deploy...
    echo Vercel will automatically detect the push and deploy.
    echo Monitor at: https://vercel.com/verifiederrors-projects/agentic
    echo.
    goto :skip_vercel_cli
)

echo [SUCCESS] Vercel CLI found
echo.

REM Check if logged in to Vercel
echo [6/7] Verifying Vercel authentication...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not logged in to Vercel
    echo.
    echo Running 'vercel login' to authenticate...
    echo.
    vercel login
    if errorlevel 1 (
        echo [ERROR] Failed to authenticate with Vercel
        echo.
        echo Falling back to GitHub auto-deploy...
        goto :skip_vercel_cli
    )
)

echo [SUCCESS] Authenticated with Vercel
echo.

REM Deploy to Vercel
echo [7/7] Deploying to Vercel...
echo.
echo Running: vercel --prod --yes
echo.
echo This will:
echo   1. Build your project
echo   2. Run database migrations
echo   3. Deploy to production
echo   4. Update production URL
echo.
echo Please wait, this may take 2-3 minutes...
echo.

REM Run Vercel deployment
vercel --prod --yes
if errorlevel 1 (
    echo.
    echo [ERROR] Vercel deployment failed
    echo.
    echo Check the error messages above for details.
    echo You can also monitor deployment at:
    echo https://vercel.com/verifiederrors-projects/agentic
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app
echo.
echo Deployment details:
echo   - Source: %CURRENT_BRANCH% branch
echo   - Platform: Vercel (via CLI)
echo   - Status: Live
echo.
echo Next steps:
echo   1. Test the production site
echo   2. Verify all features work correctly
echo   3. Check Vercel dashboard for deployment logs
echo.
goto :end

:skip_vercel_cli
echo.
echo ========================================
echo   GITHUB PUSH COMPLETED
echo ========================================
echo.
echo Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app
echo.
echo Vercel Auto-Deploy Status:
echo   - Push detected on %CURRENT_BRANCH% branch
echo   - Vercel will automatically deploy in ~2 minutes
echo   - Monitor at: https://vercel.com/verifiederrors-projects/agentic
echo.
echo What Vercel will do:
echo   1. Detect the push to %CURRENT_BRANCH%
echo   2. Install dependencies (npm install)
echo   3. Run Prisma migrations
echo   4. Build the project (npm run build)
echo   5. Deploy to production
echo.
echo Next steps:
echo   1. Wait 2-3 minutes for deployment
echo   2. Test the production site
echo   3. Check Vercel dashboard for status
echo.

:end
set /p OPEN_DASHBOARD="Open Vercel dashboard in browser? (y/n): "
if /i "!OPEN_DASHBOARD!"=="y" (
    start https://vercel.com/verifiederrors-projects/agentic
)

echo.
pause
