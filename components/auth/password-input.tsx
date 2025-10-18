'use client'

import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  borderColor?: 'gray' | 'black'
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, borderColor = 'gray', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    const borderClass = borderColor === 'black'
      ? 'border-2 border-black focus:ring-gray-900 focus:border-gray-900 bg-white'
      : 'border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-4 py-3 pr-12 rounded-lg transition-all focus:ring-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : borderClass
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
