"use client"

import React from "react"
import Link from "next/link"
import LoginForm from "../../components/LoginForm"
import { BookOpen } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 text-indigo-600 mb-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow">
              M
            </span>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              DIGITALPITSTOP <span className="text-indigo-600 font-light text-xs">MAGAZINES</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500">
            Sign in to access your purchased digital publications, instant PDF downloads, and personal library.
          </p>
        </div>

        <LoginForm redirectPath="/library" />

        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-indigo-600 transition font-medium"
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}
