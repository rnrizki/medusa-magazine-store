"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface User {
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loginWithGmail: (email: string, name?: string) => void
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("magazine_user")
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    } catch (e) {
      console.error("Failed to load user session", e)
    }
  }, [])

  const loginWithGmail = (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const displayName = name || cleanEmail.split("@")[0].replace(/[._]/g, " ")
    const newUser: User = {
      email: cleanEmail,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanEmail}`,
    }
    setUser(newUser)
    localStorage.setItem("magazine_user", JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("magazine_user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGmail,
        logout,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
