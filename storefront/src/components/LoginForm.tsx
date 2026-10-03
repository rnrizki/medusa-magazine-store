"use client"

import React, { useState } from "react"
import { useAuth } from "../lib/auth-context"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onSuccess?: () => void
  redirectPath?: string
  title?: string
  subtitle?: string
}

export default function LoginForm({
  onSuccess,
  redirectPath = "/library",
  title,
  subtitle,
}: LoginFormProps) {
  const { loginWithGmail } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Direct Email Sign In
  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    try {
      loginWithGmail(cleanEmail)
      if (onSuccess) onSuccess()
      if (redirectPath) router.push(redirectPath)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Sign in with Google
  const handleGoogleSignIn = () => {
    setError("")
    setIsGoogleLoading(true)

    // If user already typed an email into the input, sign in directly with it
    if (email.trim() && email.includes("@")) {
      loginWithGmail(email.trim())
      if (onSuccess) onSuccess()
      if (redirectPath) router.push(redirectPath)
      setIsGoogleLoading(false)
      return
    }

    // Prompt for Google account
    const promptEmail = window.prompt(
      "Sign in with Google:\nPlease enter your Gmail address (e.g. yourname@gmail.com):",
      "reader@gmail.com"
    )

    if (promptEmail && promptEmail.includes("@")) {
      loginWithGmail(promptEmail.trim())
      if (onSuccess) onSuccess()
      if (redirectPath) router.push(redirectPath)
    }
    setIsGoogleLoading(false)
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {title && (
        <div className="text-center space-y-1 mb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* Email Input & Sign In Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div>
          <input
            type="email"
            required
            placeholder="Enter your email..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError("")
            }}
            className="w-full px-4 py-3 rounded-lg border-2 border-blue-600 focus:border-blue-700 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition shadow-sm bg-white"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg bg-[#333333] hover:bg-[#222222] active:bg-black text-white font-medium text-sm transition shadow-sm flex items-center justify-center disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* OR Divider */}
      <div className="relative flex items-center justify-center my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative px-3 bg-white text-[11px] font-medium uppercase tracking-wider text-slate-400">
          OR
        </div>
      </div>

      {/* Sign in with Google Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full py-3 px-4 rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 bg-white text-slate-700 font-medium text-sm transition shadow-sm flex items-center justify-center space-x-2.5"
      >
        {/* Official Google 4-Color Logo */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{isGoogleLoading ? "Connecting..." : "Sign in with Google"}</span>
      </button>
    </div>
  )
}
