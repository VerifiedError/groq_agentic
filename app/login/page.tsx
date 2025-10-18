'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { APP_VERSION, APP_NAME, APP_TAGLINE } from '@/lib/version'

function LoginContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  // No authentication check needed here - the login form handles the redirect
  // after successful login. This prevents race conditions.

  return (
    <div className="h-screen h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* PWA-optimized: No scrolling, fits viewport exactly */}
      <div className="w-full max-w-[450px] flex flex-col p-6 md:p-8 bg-white border-2 border-black rounded-2xl shadow-lg">
        {/* Header - Compact */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-7 h-7 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">
              {APP_NAME}
            </h1>
          </div>
          <p className="text-gray-600 text-base font-medium">
            {APP_TAGLINE}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <LoginForm redirectTo={redirectTo} />

        {/* Footer - Compact */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Powered by Groq Compound AI
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {APP_VERSION} © 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-900 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
