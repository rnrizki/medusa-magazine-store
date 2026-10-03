"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useCart } from "../lib/cart-context"
import { useAuth } from "../lib/auth-context"
import LoginForm from "./LoginForm"
import {
  ShoppingBag,
  BookOpen,
  User as UserIcon,
  LogOut,
  X,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react"

export default function Navbar() {
  const { totalCount } = useCart()
  const { user, loginWithGmail, logout, isLoggedIn } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [nameInput, setNameInput] = useState("")

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput) return
    loginWithGmail(emailInput, nameInput)
    setLoginModalOpen(false)
    setEmailInput("")
    setNameInput("")
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow">
                  M
                </span>
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  DIGITALPITSTOP <span className="text-indigo-600 font-light text-sm">MAGAZINES</span>
                </span>
              </Link>
            </div>

            {/* Middle Nav */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                All Issues
              </Link>
              {isLoggedIn && (
                <Link
                  href="/library"
                  className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>My Library</span>
                </Link>
              )}
            </nav>

            {/* Right Action Items */}
            <div className="flex items-center space-x-3">
              {/* User Account Button */}
              {isLoggedIn && user ? (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/library"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-medium text-slate-800"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {user.email}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign in with Gmail</span>
                </button>
              )}

              {/* Shopping Bag */}
              <Link
                href="/cart"
                className="relative p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition"
                aria-label="View shopping bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {totalCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sign in Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 mb-5">
              <h3 className="text-xl font-black text-slate-900">
                Sign In
              </h3>
              <p className="text-xs text-slate-500">
                Access your digital magazine library & downloads
              </p>
            </div>

            <LoginForm
              onSuccess={() => setLoginModalOpen(false)}
              redirectPath="/library"
            />
          </div>
        </div>
      )}
    </>
  )
}
