'use client'

import { Suspense, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { RegisterForm } from '@/components/auth/register-form'
import { APP_VERSION, APP_NAME, APP_TAGLINE } from '@/lib/version'

function RegisterContent() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users
    if (status === 'authenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Mobile: Full screen card, Desktop: Centered card */}
      <div className="w-full max-w-[500px] p-8 md:p-10 bg-white border-2 border-black rounded-2xl shadow-lg">
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
            Create your account to get started
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm />

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Powered by Groq Compound AI
          </p>
          <p className="text-xs text-gray-400">
            {APP_VERSION} © 2025
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  )
}
