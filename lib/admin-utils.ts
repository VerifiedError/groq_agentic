/**
 * Client-safe admin utilities
 * This file contains helpers that can be safely imported in client components
 */

/**
 * Helper to check if a user is an admin in client components
 * @param session - NextAuth session object
 * @returns boolean
 */
export function isAdmin(session: any): boolean {
  return session?.user?.role === 'admin'
}
