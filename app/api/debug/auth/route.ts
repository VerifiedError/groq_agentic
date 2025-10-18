import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get token from JWT
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Get session from NextAuth
    const session = await getServerSession(authOptions)

    // Get cookies
    const cookies = request.cookies.getAll()
    const sessionCookie = cookies.find(c => c.name.includes('session-token'))

    // Get environment variables (without exposing secrets)
    const envInfo = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      token: token ? {
        sub: token.sub,
        role: token.role,
        iat: token.iat,
        exp: token.exp,
      } : null,
      session: session ? {
        user: session.user,
      } : null,
      cookies: {
        total: cookies.length,
        sessionCookie: sessionCookie ? {
          name: sessionCookie.name,
          hasValue: !!sessionCookie.value,
        } : 'NOT FOUND',
        allCookieNames: cookies.map(c => c.name),
      },
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent'),
      },
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
