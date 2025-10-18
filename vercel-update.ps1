# ========================================
# Vercel Update Script with Testing (PowerShell)
# Comprehensive pre-deployment validation and deployment
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERCEL UPDATE - AGENTIC PROJECT" -ForegroundColor Cyan
Write-Host "  With Pre-Deployment Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ====================
# Step 1: Git Check
# ====================
Write-Host "[1/9] Checking git..." -ForegroundColor Cyan

try {
    $null = git --version 2>&1
} catch {
    Write-Host "[ERROR] Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com/"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $null = git rev-parse --git-dir 2>&1
} catch {
    Write-Host "[ERROR] Not a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the project root"
    Read-Host "Press Enter to exit"
    exit 1
}

$currentBranch = git branch --show-current
Write-Host "[SUCCESS] Git ready - Branch: $currentBranch" -ForegroundColor Green
Write-Host ""

# ====================
# Step 2: Pre-Deployment Tests
# ====================
Write-Host "[2/9] Running pre-deployment tests..." -ForegroundColor Cyan
Write-Host ""

# Check if test script exists
if (Test-Path "scripts/pre-deploy-test.mjs") {
    try {
        $testProcess = Start-Process -FilePath "node" -ArgumentList "scripts/pre-deploy-test.mjs" -Wait -NoNewWindow -PassThru

        if ($testProcess.ExitCode -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] All pre-deployment tests passed!" -ForegroundColor Green
            Write-Host ""
        } elseif ($testProcess.ExitCode -eq 1) {
            Write-Host ""
            Write-Host "[ERROR] Pre-deployment tests failed!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please fix the errors above before deploying." -ForegroundColor Yellow
            Write-Host ""

            $continueChoice = Read-Host "Do you want to continue anyway? (y/n)"
            if ($continueChoice -ne 'y') {
                Write-Host "[INFO] Deployment cancelled" -ForegroundColor Yellow
                Read-Host "Press Enter to exit"
                exit 1
            }
        }
    } catch {
        Write-Host "[WARN] Could not run pre-deployment tests: $_" -ForegroundColor Yellow
        Write-Host "Continuing with deployment..." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "[WARN] Pre-deployment test script not found (scripts/pre-deploy-test.mjs)" -ForegroundColor Yellow
    Write-Host "Skipping tests..." -ForegroundColor Yellow
    Write-Host ""
}

# ====================
# Step 3: Git Status
# ====================
Write-Host "[3/9] Checking git status..." -ForegroundColor Cyan
Write-Host ""

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
    Write-Host "[4/9] Staging all changes..." -ForegroundColor Cyan
    git add .

    Write-Host "[5/9] Committing changes..." -ForegroundColor Cyan
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

# ====================
# Step 4: Push to GitHub
# ====================
Write-Host "[6/9] Pushing to GitHub..." -ForegroundColor Cyan
git push origin $currentBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to push to GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- No remote named 'origin'"
    Write-Host "- Authentication failed (check SSH keys or token)"
    Write-Host "- Network connection issues"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[SUCCESS] Pushed to GitHub: $currentBranch" -ForegroundColor Green
Write-Host ""

# ====================
# Step 5: Check Vercel CLI
# ====================
Write-Host "[7/9] Checking Vercel CLI..." -ForegroundColor Cyan
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "[SUCCESS] Vercel CLI found (v$vercelVersion)" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Vercel CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "GitHub push succeeded. Vercel will auto-deploy from GitHub." -ForegroundColor Cyan
    Write-Host "To use direct deployment, install Vercel CLI:" -ForegroundColor Cyan
    Write-Host "  npm install -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Monitor deployment at:" -ForegroundColor Cyan
    Write-Host "  https://vercel.com/verifiederrors-projects/agentic" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}
Write-Host ""

# ====================
# Step 6: Verify Vercel Auth
# ====================
Write-Host "[8/9] Verifying Vercel authentication..." -ForegroundColor Cyan
$whoamiOutput = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Not authenticated with Vercel" -ForegroundColor Yellow
    Write-Host "Attempting to login..." -ForegroundColor Cyan
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Vercel login failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "GitHub push succeeded. Vercel will auto-deploy from GitHub." -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 0
    }
}
Write-Host "[SUCCESS] Authenticated with Vercel" -ForegroundColor Green
Write-Host ""

# ====================
# Step 7: Deploy to Vercel
# ====================
Write-Host "[9/9] Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Running: vercel --prod --yes" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  1. Build your project" -ForegroundColor White
Write-Host "  2. Run database migrations" -ForegroundColor White
Write-Host "  3. Deploy to production" -ForegroundColor White
Write-Host "  4. Update production URL" -ForegroundColor White
Write-Host ""
Write-Host "Please wait, this may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

vercel --prod --yes

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Vercel deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    Write-Host "You can also monitor deployment at:" -ForegroundColor Cyan
    Write-Host "  https://vercel.com/verifiederrors-projects/agentic" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is now live!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Visit your production site to test" -ForegroundColor White
    Write-Host "2. Try logging in with: username 'addison', password 'ac783d'" -ForegroundColor White
    Write-Host "3. If login fails, run: node scripts/seed-production.mjs" -ForegroundColor White
    Write-Host ""
    Write-Host "Production Database Seeding:" -ForegroundColor Yellow
    Write-Host "  The production database might not have the admin user yet." -ForegroundColor White
    Write-Host "  To create the admin user in production:" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option 1: Manual seeding (RECOMMENDED)" -ForegroundColor Cyan
    Write-Host "    1. Set DATABASE_URL to production PostgreSQL URL" -ForegroundColor White
    Write-Host "    2. Run: node scripts/seed-production.mjs" -ForegroundColor White
    Write-Host "    3. Reset DATABASE_URL to local" -ForegroundColor White
    Write-Host ""
    Write-Host "  Option 2: Login will auto-create user" -ForegroundColor Cyan
    Write-Host "    - First login creates user automatically" -ForegroundColor White
    Write-Host "    - Username: addison" -ForegroundColor White
    Write-Host "    - Password: ac783d" -ForegroundColor White
    Write-Host ""
}

Read-Host "Press Enter to exit"
