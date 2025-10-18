/**
 * Seed admin user for authentication
 * Run with: npx ts-node prisma/seed-admin.ts
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function seedAdmin() {
  console.log('🌱 Seeding admin user...')

  try {
    // Hash the admin password
    const passwordHash = await hashPassword('ac783d')

    // Upsert admin user (update if exists, create if not)
    const admin = await prisma.user.upsert({
      where: { username: 'addison' },
      update: {
        // Update password hash and ensure admin role
        passwordHash,
        role: 'admin',
        isActive: true,
      },
      create: {
        username: 'addison',
        email: 'admin@agentic.local',
        passwordHash,
        role: 'admin',
        isActive: true,
        name: 'Addison (Admin)',
      },
    })

    console.log('✅ Admin user seeded successfully:')
    console.log(`   - Username: ${admin.username}`)
    console.log(`   - Email: ${admin.email}`)
    console.log(`   - Role: ${admin.role}`)
    console.log(`   - Active: ${admin.isActive}`)
  } catch (error) {
    console.error('❌ Error seeding admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('🎉 Seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedAdmin }
