import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin Middleware - Checks if the user is an admin
 * Returns 401 if not authenticated, 403 if not admin
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  if (session.user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Forbidden: Admin access required',
          message: 'You must be an administrator to access this resource',
        },
        { status: 403 }
      ),
    }
  }

  return {
    authorized: true,
    session,
  }
}
