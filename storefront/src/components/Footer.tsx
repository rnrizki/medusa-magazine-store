import React from "react"
import Link from "next/link"
import { QrCode, Zap, ShieldCheck } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-lg">
              <span className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-xs">
                M
              </span>
              <span>DIGITALPITSTOP</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              High-resolution digital magazine marketplace. Download and read PDF issues instantly across all devices.
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
              <QrCode className="w-3.5 h-3.5" />
              <span>NMID: ID1026568992402</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Publications
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition">
                  All Magazine Issues
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-white transition">
                  My Digital Library
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  Shopping Bag & Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Checkout Guarantee */}
          <div>
            <h4 className="text-white text-xs font-bold mb-3 tracking-wider uppercase">
              Delivery & Payment
            </h4>
            <div className="text-xs space-y-2 text-slate-400">
              <p className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Instant Free Delivery to Gmail</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <QrCode className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Standard QRIS (All Indonesian E-Wallets)</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Zero Address Required</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DIGITALPITSTOP - SOFTWARE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
