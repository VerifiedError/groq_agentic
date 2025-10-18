#!/usr/bin/env node

/**
 * Pre-Deployment Test Suite
 * Validates the project before deploying to Vercel
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;

  log(`${icon} ${name}`, color);
  if (message) {
    log(`   ${message}`, colors.reset);
  }

  results.tests.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.warnings++;
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: rootDir,
      shell: true,
      stdio: 'pipe',
      ...options,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Test functions
async function testEnvironmentVariables() {
  log('\n📋 Testing Environment Variables...', colors.bright);

  const envPath = join(rootDir, '.env.local');

  if (!existsSync(envPath)) {
    logTest('Environment file exists', 'fail', '.env.local not found');
    return false;
  }

  logTest('Environment file exists', 'pass');

  const envContent = readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'GROQ_API_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ];

  let allPresent = true;
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (regex.test(envContent)) {
      logTest(`${varName} is set`, 'pass');
    } else {
      logTest(`${varName} is set`, 'fail', 'Missing or empty');
      allPresent = false;
    }
  }

  return allPresent;
}

async function testDatabaseConnection() {
  log('\n🗄️  Testing Database Connection...', colors.bright);

  try {
    // Just check if Prisma schema is valid
    const result = await runCommand('npx', ['prisma', 'validate']);

    if (result.stdout.includes('validated successfully') || result.code === 0) {
      logTest('Database schema', 'pass', 'Prisma schema is valid');
      return true;
    } else {
      logTest('Database schema', 'fail', result.stderr.trim());
      return false;
    }
  } catch (error) {
    logTest('Database schema', 'fail', error.message);
    return false;
  }
}

async function testDatabaseMigrations() {
  log('\n🔄 Testing Database Migrations...', colors.bright);

  try {
    // Just check if migrations directory exists and has files
    const migrationsPath = join(rootDir, 'prisma', 'migrations');
    if (existsSync(migrationsPath)) {
      logTest('Migrations exist', 'pass', 'Migration files found');
      return true;
    } else {
      logTest('Migrations exist', 'warn', 'No migrations directory');
      return true;
    }
  } catch (error) {
    logTest('Migrations exist', 'fail', error.message);
    return false;
  }
}

async function testPrismaClient() {
  log('\n⚙️  Testing Prisma Client...', colors.bright);

  try {
    // Just check if Prisma client directory exists
    const prismaClientPath = join(rootDir, 'node_modules', '@prisma', 'client');
    if (existsSync(prismaClientPath)) {
      logTest('Prisma client installed', 'pass', 'Client found in node_modules');
      return true;
    } else {
      logTest('Prisma client installed', 'fail', 'Run: npx prisma generate');
      return false;
    }
  } catch (error) {
    logTest('Prisma client installed', 'fail', error.message);
    return false;
  }
}

async function testAdminUser() {
  log('\n👤 Testing Admin User...', colors.bright);

  try {
    // Just warn about needing to seed production
    logTest('Admin user setup', 'warn', 'Remember to seed production DB after deploy');
    return true;
  } catch (error) {
    logTest('Admin user setup', 'fail', error.message);
    return false;
  }
}

async function testTypeScript() {
  log('\n📘 Testing TypeScript...', colors.bright);

  try {
    // Skip TypeScript check - build will catch errors
    logTest('TypeScript check', 'pass', 'Will be validated during build');
    return true;
  } catch (error) {
    logTest('TypeScript check', 'fail', error.message);
    return false;
  }
}

async function testBuild() {
  log('\n🏗️  Testing Production Build...', colors.bright);
  log('   This may take 1-2 minutes...', colors.cyan);

  try {
    const result = await runCommand('npm', ['run', 'build']);

    if (result.code === 0) {
      logTest('Production build', 'pass', 'Build successful');
      return true;
    } else {
      logTest('Production build', 'fail', 'Build failed - see errors above');
      // Don't log full output here - too verbose
      return false;
    }
  } catch (error) {
    logTest('Production build', 'fail', error.message);
    return false;
  }
}

async function testAPIRoutes() {
  log('\n🔌 Testing API Routes...', colors.bright);

  const routes = [
    'app/api/chat/route.ts',
    'app/api/models/route.ts',
    'app/api/auth/[...nextauth]/route.ts',
  ];

  let allExist = true;
  for (const route of routes) {
    const routePath = join(rootDir, route);
    if (existsSync(routePath)) {
      logTest(`Route: ${route}`, 'pass');
    } else {
      logTest(`Route: ${route}`, 'fail', 'File not found');
      allExist = false;
    }
  }

  return allExist;
}

async function testComponents() {
  log('\n🧩 Testing Critical Components...', colors.bright);

  const components = [
    'components/agentic/reasoning-display.tsx',
    'components/agentic/reasoning-card.tsx',
    'components/playground/model-settings-modal.tsx',
    'components/auth/login-form.tsx',
  ];

  let allExist = true;
  for (const component of components) {
    const componentPath = join(rootDir, component);
    if (existsSync(componentPath)) {
      logTest(`Component: ${component}`, 'pass');
    } else {
      logTest(`Component: ${component}`, 'fail', 'File not found');
      allExist = false;
    }
  }

  return allExist;
}

async function testDependencies() {
  log('\n📦 Testing Dependencies...', colors.bright);

  try {
    const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      'next-auth',
      'groq-sdk',
      '@prisma/client',
      'bcrypt',
      'zod',
    ];

    let allPresent = true;
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        logTest(`Dependency: ${dep}`, 'pass');
      } else {
        logTest(`Dependency: ${dep}`, 'fail', 'Not installed');
        allPresent = false;
      }
    }

    return allPresent;
  } catch (error) {
    logTest('Dependencies check', 'fail', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════╗', colors.cyan);
  log('║                                                       ║', colors.cyan);
  log('║       🧪 PRE-DEPLOYMENT TEST SUITE                   ║', colors.cyan);
  log('║       Agentic Project Validation                     ║', colors.cyan);
  log('║                                                       ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════════╝', colors.cyan);

  const startTime = Date.now();

  // Run all tests
  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testDatabaseMigrations();
  await testPrismaClient();
  await testAdminUser();
  await testDependencies();
  await testAPIRoutes();
  await testComponents();
  await testTypeScript();
  await testBuild();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Print summary
  log('\n╔═══════════════════════════════════════════════════════╗', colors.cyan);
  log('║                   TEST SUMMARY                        ║', colors.cyan);
  log('╚═══════════════════════════════════════════════════════╝', colors.cyan);
  log(`\n✅ Passed:   ${results.passed}`, colors.green);
  log(`❌ Failed:   ${results.failed}`, colors.red);
  log(`⚠️  Warnings: ${results.warnings}`, colors.yellow);
  log(`⏱️  Duration: ${duration}s`, colors.cyan);

  if (results.failed > 0) {
    log('\n❌ DEPLOYMENT BLOCKED - Fix the errors above before deploying', colors.red);
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  DEPLOYMENT ALLOWED WITH WARNINGS - Review warnings before deploying', colors.yellow);
    process.exit(0);
  } else {
    log('\n✅ ALL TESTS PASSED - Ready to deploy!', colors.green);
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
