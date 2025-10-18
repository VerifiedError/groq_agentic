# ========================================
# Vercel Update Script (PowerShell)
# One-click deployment to Vercel via CLI
# ========================================

Write-Host ""
Write-Host "========================================"
Write-Host "  VERCEL UPDATE - AGENTIC PROJECT"
Write-Host "========================================"
Write-Host ""

# Check if git is installed
try {
    $null = git --version
} catch {
    Write-Host "[ERROR] Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in a git repository
try {
    $null = git rev-parse --git-dir 2>&1
} catch {
    Write-Host "[ERROR] Not a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the project root"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/7] Checking git status..." -ForegroundColor Cyan
Write-Host ""

# Get current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch"
Write-Host ""

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "[!] You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""

    $commitChoice = Read-Host "Do you want to commit these changes? (y/n)"
    if ($commitChoice -ne 'y') {
        Write-Host ""
        Write-Host "[INFO] Deployment cancelled. Please commit or stash your changes." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    }

    Write-Host ""
    $commitMsg = Read-Host "Enter commit message"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        Write-Host "[ERROR] Commit message cannot be empty" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Host "[2/7] Staging all changes..." -ForegroundColor Cyan
    git add .

    Write-Host "[3/7] Committing changes..." -ForegroundColor Cyan
    git commit -m $commitMsg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to commit changes" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[SUCCESS] Changes committed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[SUCCESS] No uncommitted changes" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[4/7] Pushing to GitHub..." -ForegroundColor Cyan
git push origin $currentBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to push to GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:"
    Write-Host "- No remote named 'origin'"
    Write-Host "- Authentication failed (check SSH keys or token)"
    Write-Host "- Network connection issues"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[SUCCESS] Pushed to GitHub: $currentBranch" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "[5/7] Checking Vercel CLI..." -ForegroundColor Cyan
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "[SUCCESS] Vercel CLI found (v$vercelVersion)" -ForegroundColor Green
    Write-Host ""

    # Check if logged in to Vercel
    Write-Host "[6/7] Verifying Vercel authentication..." -ForegroundColor Cyan
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] Not logged in to Vercel" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Running 'vercel login' to authenticate..."
        Write-Host ""
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to authenticate with Vercel" -ForegroundColor Red
            Write-Host ""
            Write-Host "Falling back to GitHub auto-deploy..."
            throw "Auth failed"
        }
    }

    Write-Host "[SUCCESS] Authenticated with Vercel" -ForegroundColor Green
    Write-Host ""

    # Deploy to Vercel
    Write-Host "[7/7] Deploying to Vercel..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Running: vercel --prod --yes" -ForegroundColor White
    Write-Host ""
    Write-Host "This will:" -ForegroundColor White
    Write-Host "  1. Build your project"
    Write-Host "  2. Run database migrations"
    Write-Host "  3. Deploy to production"
    Write-Host "  4. Update production URL"
    Write-Host ""
    Write-Host "Please wait, this may take 2-3 minutes..." -ForegroundColor Yellow
    Write-Host ""

    # Run Vercel deployment
    vercel --prod --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Vercel deployment failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check the error messages above for details."
        Write-Host "You can also monitor deployment at:"
        Write-Host "https://vercel.com/verifiederrors-projects/agentic"
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Host "========================================"
    Write-Host "  DEPLOYMENT COMPLETED SUCCESSFULLY"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment details:"
    Write-Host "  - Source: $currentBranch branch"
    Write-Host "  - Platform: Vercel (via CLI)"
    Write-Host "  - Status: Live"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Test the production site"
    Write-Host "  2. Verify all features work correctly"
    Write-Host "  3. Check Vercel dashboard for deployment logs"
    Write-Host ""

} catch {
    Write-Host "[WARNING] Vercel CLI is not installed or not authenticated" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install Vercel CLI:"
    Write-Host "  npm install -g vercel"
    Write-Host ""
    Write-Host "Alternatively, visit: https://vercel.com/docs/cli"
    Write-Host ""
    Write-Host "Falling back to GitHub auto-deploy..."
    Write-Host "Vercel will automatically detect the push and deploy."
    Write-Host "Monitor at: https://vercel.com/verifiederrors-projects/agentic"
    Write-Host ""

    Write-Host ""
    Write-Host "========================================"
    Write-Host "  GITHUB PUSH COMPLETED"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Production URL: https://agentic-iewrzpluo-verifiederrors-projects.vercel.app"
    Write-Host ""
    Write-Host "Vercel Auto-Deploy Status:"
    Write-Host "  - Push detected on $currentBranch branch"
    Write-Host "  - Vercel will automatically deploy in ~2 minutes"
    Write-Host "  - Monitor at: https://vercel.com/verifiederrors-projects/agentic"
    Write-Host ""
    Write-Host "What Vercel will do:"
    Write-Host "  1. Detect the push to $currentBranch"
    Write-Host "  2. Install dependencies (npm install)"
    Write-Host "  3. Run Prisma migrations"
    Write-Host "  4. Build the project (npm run build)"
    Write-Host "  5. Deploy to production"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Wait 2-3 minutes for deployment"
    Write-Host "  2. Test the production site"
    Write-Host "  3. Check Vercel dashboard for status"
    Write-Host ""
}

$openDashboard = Read-Host "Open Vercel dashboard in browser? (y/n)"
if ($openDashboard -eq 'y') {
    Start-Process "https://vercel.com/verifiederrors-projects/agentic"
}

Write-Host ""
Read-Host "Press Enter to exit"
