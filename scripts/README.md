# Scripts Directory

Utility scripts for deployment, testing, and database management.

## 📋 Scripts Overview

### 🧪 pre-deploy-test.mjs
**Pre-Deployment Test Suite** - Validates project before deploying

**What it tests:**
- ✅ Environment variables (.env.local)
- ✅ Database connection
- ✅ Database migrations status
- ✅ Prisma client generation
- ✅ Admin user exists (local/production)
- ✅ TypeScript compilation
- ✅ Production build
- ✅ API routes exist
- ✅ Critical components exist
- ✅ Dependencies installed

**Usage:**
```bash
node scripts/pre-deploy-test.mjs
```

**Exit codes:**
- `0` - All tests passed (or warnings only)
- `1` - Tests failed (deployment blocked)

**Integration:**
- Automatically run by `vercel-update.ps1` before deploying
- Can be run manually for local validation

---

### 🌱 seed-production.mjs
**Production Database Seeding** - Creates admin user in production database

**What it does:**
- Creates admin user with username `addison`, password `ac783d`
- Hashes password with bcrypt (12 rounds)
- Sets role to `admin`, isActive to `true`
- Skips if admin user already exists

**Usage:**

**Option 1: Temporary environment variable (Recommended)**
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://user:pass@host/db"; node scripts/seed-production.mjs; Remove-Item Env:DATABASE_URL

# Linux/Mac
DATABASE_URL="postgresql://user:pass@host/db" node scripts/seed-production.mjs
```

**Option 2: Update .env.local temporarily**
```bash
# 1. Replace DATABASE_URL in .env.local with production URL
# 2. Run seeding
node scripts/seed-production.mjs

# 3. Restore DATABASE_URL to local value
```

**Important:**
- This script connects to whatever database is in `DATABASE_URL`
- ONLY run this on production database, NOT local
- Admin credentials: `addison` / `ac783d`

---

## 🚀 Deployment Workflow

### Automated (vercel-update.ps1)
```bash
# Double-click or run from PowerShell
./vercel-update.ps1
```

**Steps:**
1. Runs pre-deployment tests
2. Commits uncommitted changes (if any)
3. Pushes to GitHub
4. Deploys to Vercel via CLI
5. Shows seeding instructions

### Manual Testing
```bash
# Run tests locally before committing
node scripts/pre-deploy-test.mjs

# Seed production database after deploy
node scripts/seed-production.mjs
```

---

## 🔧 Common Issues

### "Admin user doesn't exist" on production
**Cause:** Production database is empty (new PostgreSQL instance)

**Fix:**
```bash
# Option 1: Manual seeding (Recommended)
DATABASE_URL="<production-url>" node scripts/seed-production.mjs

# Option 2: First login auto-creates user
# Just try logging in with addison/ac783d
# The auth system will create the user automatically
```

### "Pre-deployment tests failed"
**Cause:** Local environment has issues

**Fix:**
1. Check the error messages from the test output
2. Fix the specific failing tests
3. Re-run tests: `node scripts/pre-deploy-test.mjs`
4. Once passing, run `vercel-update.ps1` again

### "Build failed" during tests
**Cause:** TypeScript errors or Next.js build issues

**Fix:**
1. Check test output for specific errors
2. Run `npm run build` locally to see full error
3. Fix errors in code
4. Re-run tests

---

## 📝 Adding New Tests

To add a new test to `pre-deploy-test.mjs`:

```javascript
async function testMyNewFeature() {
  log('\n🔍 Testing My New Feature...', colors.bright);

  try {
    // Your test logic here
    const result = await runCommand('my-command', ['arg1', 'arg2']);

    if (result.code === 0) {
      logTest('My feature works', 'pass', 'All good!');
      return true;
    } else {
      logTest('My feature works', 'fail', result.stderr.trim());
      return false;
    }
  } catch (error) {
    logTest('My feature works', 'fail', error.message);
    return false;
  }
}

// Add to runTests() function:
async function runTests() {
  // ... existing tests ...
  await testMyNewFeature(); // Add here
  // ... rest of tests ...
}
```

---

## 🎯 Best Practices

1. **Always run tests before deploying**
   - Use `vercel-update.ps1` which auto-runs tests
   - Or manually: `node scripts/pre-deploy-test.mjs`

2. **Seed production database after first deploy**
   - Production database starts empty
   - Run `seed-production.mjs` to create admin user
   - Or let first login auto-create the user

3. **Keep local and production databases separate**
   - Local: SQLite or local PostgreSQL
   - Production: Vercel PostgreSQL (Neon)
   - Use `DATABASE_URL` to switch between them

4. **Check test output carefully**
   - Green ✅ = Pass
   - Red ❌ = Fail (blocks deployment)
   - Yellow ⚠️ = Warning (allows deployment)

---

## 📚 Related Files

- `vercel-update.ps1` - Main deployment script (calls pre-deploy-test.mjs)
- `vercel-update.bat` - Simple wrapper for PowerShell script
- `prisma/seed-admin.ts` - Local database admin seeding (TypeScript)
- `.env.local` - Environment variables (DATABASE_URL, etc.)
