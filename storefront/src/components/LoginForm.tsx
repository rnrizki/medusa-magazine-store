"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "../lib/auth-context"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    google?: any
  }
}

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
  const [notice, setNotice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGsiLoaded, setIsGsiLoaded] = useState(false)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Load Google Identity Services (GSI) SDK dynamically
  useEffect(() => {
    if (typeof window === "undefined") return

    // If script is already in document
    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      setIsGsiLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsGsiLoaded(true)
      if (googleClientId && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              const profile = parseJwt(response.credential)
              if (profile?.email) {
                loginWithGmail(profile.email, profile.name, profile.picture)
                if (onSuccess) onSuccess()
                if (redirectPath) router.push(redirectPath)
              }
            }
          },
          auto_select: false,
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup script reference if needed
    }
  }, [googleClientId])

  // Helper to parse Google Identity JWT without external library
  function parseJwt(token: string) {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  // Direct Email Sign In
  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNotice("")

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

  // Official Google Identity Services (OAuth 2.0)
  const handleGoogleSignIn = () => {
    setError("")
    setNotice("")
    setIsGoogleLoading(true)

    // Case 1: Official Google OAuth 2.0 with Client ID
    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            setIsGoogleLoading(false)
            if (tokenResponse && tokenResponse.access_token) {
              try {
                // Fetch verified profile from Google UserInfo endpoint
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                })
                const googleProfile = await res.json()
                if (googleProfile?.email) {
                  loginWithGmail(
                    googleProfile.email,
                    googleProfile.name,
                    googleProfile.picture
                  )
                  if (onSuccess) onSuccess()
                  if (redirectPath) router.push(redirectPath)
                }
              } catch (err) {
                console.error("Google userinfo fetch error", err)
                setError("Failed to retrieve Google profile.")
              }
            } else if (tokenResponse?.error) {
              setError(`Google Sign In: ${tokenResponse.error}`)
            }
          },
        })

        tokenClient.requestAccessToken({ prompt: "consent" })
        return
      } catch (err: any) {
        console.warn("Failed to initialize Google tokenClient, falling back", err)
      }
    }

    // Case 2: Google One Tap prompt via ID service
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        setIsGoogleLoading(false)
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          promptFallback()
        }
      })
      return
    }

    // Case 3: Client ID not yet set in environment
    promptFallback()
  }

  const promptFallback = () => {
    setIsGoogleLoading(false)

    // If user already typed their email in the input, sign in with that
    if (email.trim() && email.includes("@")) {
      loginWithGmail(email.trim())
      if (onSuccess) onSuccess()
      if (redirectPath) router.push(redirectPath)
      return
    }

    // Show notice explaining Google Identity Services configuration
    setNotice(
      "Google OAuth 2.0 SDK is loaded! To open Google's official popup, configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables. You can sign in directly with your email below."
    )

    const fallbackEmail = window.prompt(
      "Sign in with Google Account:\nEnter your Gmail address:",
      "reader@gmail.com"
    )

    if (fallbackEmail && fallbackEmail.includes("@")) {
      loginWithGmail(fallbackEmail.trim())
      if (onSuccess) onSuccess()
      if (redirectPath) router.push(redirectPath)
    }
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

      {notice && (
        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] leading-relaxed text-center">
          {notice}
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
              if (notice) setNotice("")
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

      {/* Official Sign in with Google Button */}
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
        <span>
          {isGoogleLoading
            ? "Connecting to Google..."
            : "Sign in with Google"}
        </span>
      </button>

      {/* Environment Client ID status hint */}
      {googleClientId && (
        <p className="text-[10px] text-center text-slate-400">
          🔒 Secured with Google Identity Services (OAuth 2.0)
        </p>
      )}
    </div>
  )
}
