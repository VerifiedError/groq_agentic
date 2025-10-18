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
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gray-50 p-4">
      {/* Mobile: Full screen card, Desktop: Centered card */}
      <div className="w-full max-w-[450px] max-h-[90vh] overflow-y-auto p-8 md:p-10 bg-white border-2 border-black rounded-2xl shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-gray-900" />
            <h1 className="text-4xl font-bold text-gray-900">
              {APP_NAME}
            </h1>
          </div>
          <p className="text-gray-600 text-lg font-medium">
            {APP_TAGLINE}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to continue
          </p>
        </div>

        {/* Login Form */}
        <LoginForm redirectTo={redirectTo} />

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Powered by Groq Compound AI
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {APP_VERSION} © 2025
          </p>
          <p className="text-xs font-mono text-gray-400">
            Login Fix v4 - Debug Mode
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
