#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * Seeds admin user to production database
 * Run this AFTER deploying to Vercel
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Admin credentials (same as local)
const ADMIN_USERNAME = 'addison';
const ADMIN_PASSWORD = 'ac783d'; // Will be hashed
const ADMIN_EMAIL = 'addison@agentic.local';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function seedAdminUser() {
  try {
    log('\n🌱 Seeding Production Database...', colors.cyan);

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME },
    });

    if (existingAdmin) {
      log(`✅ Admin user '${ADMIN_USERNAME}' already exists`, colors.green);
      log(`   ID: ${existingAdmin.id}`, colors.reset);
      log(`   Email: ${existingAdmin.email}`, colors.reset);
      log(`   Role: ${existingAdmin.role}`, colors.reset);
      log(`   Active: ${existingAdmin.isActive}`, colors.reset);
      return existingAdmin;
    }

    // Hash password
    log(`\n🔐 Hashing password with bcrypt (12 rounds)...`, colors.cyan);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Create admin user
    log(`\n👤 Creating admin user '${ADMIN_USERNAME}'...`, colors.cyan);
    const admin = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        name: 'Addison (Admin)',
        passwordHash,
        role: 'admin',
        isActive: true,
      },
    });

    log(`\n✅ Admin user created successfully!`, colors.green);
    log(`   ID: ${admin.id}`, colors.reset);
    log(`   Username: ${admin.username}`, colors.reset);
    log(`   Email: ${admin.email}`, colors.reset);
    log(`   Role: ${admin.role}`, colors.reset);

    log(`\n🔑 Login Credentials:`, colors.cyan);
    log(`   Username: ${ADMIN_USERNAME}`, colors.yellow);
    log(`   Password: ${ADMIN_PASSWORD}`, colors.yellow);

    return admin;
  } catch (error) {
    log(`\n❌ Error seeding database: ${error.message}`, colors.red);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedAdminUser()
  .then(() => {
    log(`\n✅ Seeding completed successfully!`, colors.green);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
