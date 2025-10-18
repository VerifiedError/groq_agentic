/**
 * Fix existing users before migration
 * Sets default values for username and password_hash
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function fixExistingUsers() {
  console.log('🔧 Fixing existing users...')

  try {
    // Get all users with null username or password_hash
    const usersToFix = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { passwordHash: null },
        ],
      },
    })

    console.log(`Found ${usersToFix.length} users to fix`)

    for (const user of usersToFix) {
      console.log(`\nFixing user: ${user.email}`)

      // Generate username from email if null
      const username = user.username || user.email.split('@')[0]

      // Generate default password hash if null (using email as password)
      const passwordHash = user.passwordHash || await hashPassword('changeme123')

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          passwordHash,
        },
      })

      console.log(`✅ Fixed user: ${username}`)
    }

    console.log('\n✅ All users fixed successfully!')
    console.log('\nIMPORTANT: Users with default passwords should change them on first login.')
  } catch (error) {
    console.error('❌ Error fixing users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run fix if executed directly
if (require.main === module) {
  fixExistingUsers()
    .then(() => {
      console.log('🎉 Fix complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Fix failed:', error)
      process.exit(1)
    })
}

module.exports = { fixExistingUsers }
