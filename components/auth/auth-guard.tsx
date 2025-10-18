'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated') {
      // Save the current path to redirect back after login
      const redirectUrl = encodeURIComponent(pathname || '/')
      router.push(`/login?redirect=${redirectUrl}`)
    } else {
      setIsChecking(false)
    }
  }, [status, pathname, router])

  if (status === 'loading' || isChecking) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Checking authentication...
            </p>
          </div>
        </div>
      )
    )
  }

  if (status === 'authenticated') {
    return <>{children}</>
  }

  return null
}
