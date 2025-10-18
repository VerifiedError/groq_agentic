import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define protected routes
const protectedRoutes = ['/', '/playground']

// Define public routes (no auth required)
const publicRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(7)

  // Log all requests for debugging
  console.log(`[Middleware ${requestId}] Request: ${pathname}`)

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes and API routes to pass through
  if (isPublicRoute || pathname.startsWith('/api/')) {
    console.log(`[Middleware ${requestId}] Public/API route - allowing`)
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (!isProtectedRoute) {
    console.log(`[Middleware ${requestId}] Unprotected route - allowing`)
    return NextResponse.next()
  }

  console.log(`[Middleware ${requestId}] Protected route detected`)

  // Debug: Log environment variables
  console.log(`[Middleware ${requestId}] Environment:`, {
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
  })

  // Debug: Log all cookies
  const cookieHeader = request.headers.get('cookie')
  console.log(`[Middleware ${requestId}] Cookie header:`, cookieHeader || 'NONE')

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    console.log(`[Middleware ${requestId}] Cookies found (${cookies.length}):`, cookies)

    // Look for NextAuth cookies specifically
    const nextAuthCookies = cookies.filter(c => c.includes('next-auth'))
    console.log(`[Middleware ${requestId}] NextAuth cookies:`, nextAuthCookies.length > 0 ? nextAuthCookies : 'NONE')
  }

  // Get the token from the session
  console.log(`[Middleware ${requestId}] Attempting getToken()...`)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log(`[Middleware ${requestId}] getToken() result:`, token ? {
    sub: token.sub,
    role: token.role,
    hasToken: true,
  } : 'NULL - NO TOKEN FOUND')

  // If no token, redirect to login with return URL
  if (!token) {
    console.log(`[Middleware ${requestId}] No token - redirecting to login`)
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // User is authenticated, allow access
  console.log(`[Middleware ${requestId}] Token valid - allowing access`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
