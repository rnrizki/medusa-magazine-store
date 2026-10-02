"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ShoppingBag, Menu, X, ArrowUpRight, ShieldCheck } from "lucide-react"
import { useCart } from "../lib/cart-context"

export default function Navbar() {
  const { totalCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black tracking-wider text-sm shadow">
                M2
              </span>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                MedusaStore
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              Docker Stack
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="hover:text-slate-900 transition-colors"
            >
              Catalog
            </Link>
            <a
              href="http://localhost:9000/app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-semibold"
            >
              Medusa Admin <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/cart"
              className="relative p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalCount > 0 && (
                <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {totalCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            All Products
          </Link>
          <a
            href="http://localhost:9000/app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center px-3 py-2 rounded-md text-base font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            Medusa Admin Dashboard <ArrowUpRight className="w-4 h-4 ml-1" />
          </a>
        </div>
      )}
    </header>
  )
}
