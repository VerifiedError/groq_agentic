'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Lock, X } from 'lucide-react'
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

// localStorage key for persisted debug log
const DEBUG_LOG_KEY = 'playground-login-debug-log'
const DEBUG_LOG_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Load persisted debug log on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEBUG_LOG_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only load if less than 24 hours old
        if (Date.now() - parsed.timestamp < DEBUG_LOG_EXPIRY) {
          setDebugLog(parsed.logs)
        } else {
          localStorage.removeItem(DEBUG_LOG_KEY)
        }
      }
    } catch (e) {
      console.error('[Login] Failed to load debug log:', e)
      localStorage.removeItem(DEBUG_LOG_KEY)
    }
  }, [])

  // Persist debug log to localStorage whenever it changes
  useEffect(() => {
    if (debugLog.length > 0) {
      try {
        localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify({
          logs: debugLog,
          timestamp: Date.now()
        }))
      } catch (e) {
        console.error('[Login] Failed to save debug log:', e)
      }
    }
  }, [debugLog])

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[Login Debug] ${message}`)
  }

  const clearDebugLog = () => {
    setDebugLog([])
    localStorage.removeItem(DEBUG_LOG_KEY)
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
    addDebugLog('🔄 Starting login process...')
    setDebugInfo('Starting login...')
    setIsLoading(true)

    try {
      addDebugLog(`👤 Attempting to authenticate: ${data.username}`)
      setDebugInfo(`Authenticating ${data.username}...`)

      // Check CSRF token first
      addDebugLog('🔐 Checking CSRF token...')
      try {
        const csrfResponse = await fetch('/api/auth/csrf')
        const csrfData = await csrfResponse.json()

        if (!csrfData.csrfToken) {
          addDebugLog('❌ CSRF Error: Missing CSRF token')
          setError('Security token missing. Please refresh the page and try again.')
          setIsLoading(false)
          return
        }

        addDebugLog(`✅ CSRF token obtained: ${csrfData.csrfToken.substring(0, 10)}...`)
      } catch (csrfErr) {
        addDebugLog(`❌ CSRF Error: ${csrfErr instanceof Error ? csrfErr.message : 'Unknown error'}`)
        setError('Failed to obtain security token. Please check your internet connection.')
        setIsLoading(false)
        return
      }

      // Use redirect: false to capture and inspect the result
      addDebugLog('🚀 Calling signIn with redirect: false to capture result...')

      try {
        const result = await signIn('credentials', {
          username: data.username,
          password: data.password,
          callbackUrl: redirectTo,
          redirect: false,  // We'll handle redirect manually to debug
        })

        // Log the complete result object
        addDebugLog(`📊 SignIn Result: ${JSON.stringify(result, null, 2)}`)

        if (result) {
          addDebugLog(`  - ok: ${result.ok}`)
          addDebugLog(`  - status: ${result.status}`)
          addDebugLog(`  - error: ${result.error || 'null'}`)
          addDebugLog(`  - url: ${result.url || 'null'}`)
        }

        if (result?.ok) {
          // Success!
          addDebugLog('✅ Authentication successful!')
          addDebugLog(`🔄 Redirecting to: ${result.url || redirectTo}`)
          setDebugInfo('Login successful! Redirecting...')

          // Use NextAuth's URL if provided, otherwise use our redirectTo
          const redirectUrl = result.url || redirectTo

          // Hard redirect with window.location to force full page reload with new session
          addDebugLog(`🌐 Executing: window.location.href = "${redirectUrl}"`)
          setTimeout(() => {
            window.location.href = redirectUrl
          }, 500) // Small delay to show success message
        } else {
          // Failed
          const errorMsg = result?.error || 'Unknown error'
          addDebugLog(`❌ Authentication failed: ${errorMsg}`)
          addDebugLog(`   Status code: ${result?.status || 'unknown'}`)

          // Show user-friendly error message
          setError(result?.error || 'Invalid username or password. Please try again.')
          setIsLoading(false)
        }
      } catch (signInErr) {
        // Handle different error types
        if (signInErr instanceof TypeError && signInErr.message.includes('fetch')) {
          addDebugLog('❌ Network Error: Cannot reach authentication server')
          setError('Network error. Please check your internet connection.')
        } else {
          const errorMessage = signInErr instanceof Error ? signInErr.message : 'Authentication error'
          addDebugLog(`❌ SignIn Exception: ${errorMessage}`)
          setError(`Authentication failed: ${errorMessage}`)
        }

        setIsLoading(false)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login'
      addDebugLog(`❌ Uncaught Exception: ${errorMessage}`)
      setError(errorMessage)
      setDebugInfo('')
      setIsLoading(false)
    }
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

      {/* Persistent Debug Log Display */}
      {debugLog.length > 0 && (
        <div className="space-y-2">
          <div className="p-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-yellow-900">🔍 DEBUG LOG (Persisted)</p>
              <button
                type="button"
                onClick={clearDebugLog}
                className="text-xs text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
            {debugLog.map((log, idx) => (
              <p
                key={idx}
                className={`text-xs font-mono ${
                  log.includes('❌') ? 'text-red-700 font-bold' :
                  log.includes('✅') ? 'text-green-700' :
                  log.includes('⚠️') ? 'text-orange-700' :
                  'text-yellow-900'
                }`}
              >
                {log}
              </p>
            ))}
          </div>
          <p className="text-xs text-gray-500 italic">
            ℹ️ This log persists across page refreshes for 24 hours
          </p>
        </div>
      )}

      {/* Debug Info Display */}
      {debugInfo && (
        <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-lg">
          <p className="text-sm font-medium text-blue-700">{debugInfo}</p>
        </div>
      )}

      {/* Error Display */}
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
