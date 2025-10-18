'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Lock } from 'lucide-react'
import { PasswordInput } from './password-input'
import Link from 'next/link'

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .trim()
    .toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[Login Debug] ${message}`)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    setDebugLog([]) // Clear previous logs
    addDebugLog('Starting login process...')
    setDebugInfo('Starting login...')
    setIsLoading(true)

    try {
      addDebugLog(`Attempting to authenticate: ${data.username}`)
      setDebugInfo(`Authenticating ${data.username}...`)

      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        callbackUrl: redirectTo,
        redirect: false,
      })

      addDebugLog(`SignIn result: ok=${result?.ok}, status=${result?.status}, error=${result?.error}`)

      setDebugInfo(`Result: ${result?.ok ? 'Success' : 'Failed'} (Status: ${result?.status})`)

      if (result?.ok) {
        // Successful login - wait longer before redirect to ensure cookie is set
        addDebugLog('✅ Authentication successful!')
        addDebugLog(`Redirect target: ${redirectTo}`)
        setDebugInfo('Login successful! Redirecting...')

        addDebugLog('Waiting 1.5 seconds for session cookie to set...')
        await new Promise(resolve => setTimeout(resolve, 1500))

        addDebugLog('Attempting redirect via window.location.href...')
        // Use window.location for hard redirect to ensure fresh session
        window.location.href = redirectTo
      } else {
        // Authentication failed - show specific error from NextAuth
        const errorMessage = result?.error
          ? result.error
          : `Authentication failed (Status: ${result?.status || 'unknown'})`

        addDebugLog(`❌ Authentication failed: ${errorMessage}`)
        setError(errorMessage)
        setDebugInfo('')
        setValue('password', '') // Clear password on error
        setIsLoading(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login'
      addDebugLog(`❌ Exception during login: ${errorMessage}`)
      setError(errorMessage)
      setDebugInfo('')
      setIsLoading(false)
    }
    // Don't set isLoading to false on success - let the redirect happen
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Username
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <User className="w-5 h-5" />
          </div>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoFocus
            disabled={isLoading}
            className={`w-full pl-11 pr-4 py-3 bg-white border-2 rounded-lg transition-all focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.username
                ? 'border-red-500'
                : 'border-black'
            }`}
            placeholder="Enter your username"
            {...register('username')}
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10">
            <Lock className="w-5 h-5" />
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            disabled={isLoading}
            placeholder="Enter your password"
            error={errors.password?.message}
            className="pl-11"
            borderColor="black"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            disabled={isLoading}
            className="w-4 h-4 border-2 border-black rounded focus:ring-gray-900 disabled:opacity-50"
            {...register('rememberMe')}
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 text-sm text-gray-700"
          >
            Remember me
          </label>
        </div>
      </div>

      {/* Debug Log Display - Always visible */}
      {debugLog.length > 0 && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg max-h-40 overflow-y-auto">
          <p className="text-xs font-bold text-yellow-900 mb-2">🔍 DEBUG LOG:</p>
          {debugLog.map((log, idx) => (
            <p key={idx} className="text-xs font-mono text-yellow-900">{log}</p>
          ))}
        </div>
      )}

      {/* Debug Info Display */}
      {debugInfo && (
        <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-lg">
          <p className="text-sm font-medium text-blue-700">{debugInfo}</p>
        </div>
      )}

      {/* Error Display - Always visible for debugging */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-200 focus:ring-4 focus:ring-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-gray-900 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </form>
  )
}
