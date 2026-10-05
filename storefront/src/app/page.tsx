import React from "react"
import Link from "next/link"
import { getCategories, getMagazines } from "../lib/db"
import MagazineCatalog from "../components/MagazineCatalog"
import { QrCode, Mail, Zap, BookOpen, ShieldCheck, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const categories = getCategories()
  const magazines = getMagazines()

  return (
    <div className="space-y-12 pb-20">
      {/* Editorial Magazine Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 sm:py-24 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 opacity-90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Digital Magazine Editions • 3:4 Cover Art</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Curated Digital Magazines,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Instant QRIS Access.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            High-definition digital publications. No physical shipping, no delays—pay with any Indonesian banking app or e-wallet via QRIS, and access issues immediately on your Gmail.
          </p>

          {/* Value Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
              <QrCode className="w-3.5 h-3.5 text-rose-400" />
              <span>QRIS ShopeePay / BCA / Dana / GoPay</span>
            </span>

            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Checkout with Name & Gmail only</span>
            </span>

            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free Instant Digital Delivery</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Magazine Catalog with Category Management */}
      <section id="magazine-catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Featured Issues & Publications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select a category below to filter our high-resolution digital releases.
          </p>
        </div>

        <MagazineCatalog
          initialCategories={categories}
          initialMagazines={magazines}
        />
      </section>
    </div>
  )
}
