"use client"

import React, { useState } from "react"
import { Magazine } from "../../../lib/types"
import { formatRupiah } from "../../../lib/format"
import { useCart } from "../../../lib/cart-context"
import {
  ShoppingBag,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Mail,
  FileText,
  BookmarkCheck,
} from "lucide-react"
import Link from "next/link"

export default function MagazineDetailClient({
  magazine,
}: {
  magazine: Magazine
}) {
  const { addItem, isInCart } = useCart()
  const inCart = isInCart(magazine.id)
  const [justAdded, setJustAdded] = useState(false)

  const handleAdd = () => {
    if (!inCart) {
      addItem(magazine)
      setJustAdded(true)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Left Column: 3:4 Cover Art Display */}
      <div className="lg:col-span-5">
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200">
          <img
            src={magazine.coverImage}
            alt={magazine.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Book Spine Overlay Shadow */}
          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />

          {/* Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {magazine.categoryName}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <span className="bg-emerald-500/90 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
              Digital License
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Magazine Details & Purchase */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          {magazine.issueNumber && (
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              {magazine.issueNumber}
            </p>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {magazine.title}
          </h1>

          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-black text-slate-900">
              {formatRupiah(magazine.price)}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Instant Delivery to Gmail
            </span>
          </div>
        </div>

        {/* Digital Product Delivery Notice */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs text-indigo-950 space-y-0.5">
            <p className="font-bold">Digital Edition • Free Instant Delivery</p>
            <p className="text-indigo-800/80 leading-relaxed">
              No physical shipping required. Pay with QRIS and your high-res digital magazine PDF will be linked directly to your Gmail account.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {inCart || justAdded ? (
            <div className="space-y-2">
              <Link
                href="/cart"
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/20"
              >
                <Check className="w-5 h-5" />
                <span>Added to Bag • Proceed to Checkout</span>
              </Link>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg active:scale-[0.99]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add Digital Issue to Bag</span>
            </button>
          )}
        </div>

        {/* Editorial Synopsis */}
        <div className="border-t border-slate-200 pt-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Editorial Synopsis</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-light">
            {magazine.description}
          </p>
        </div>

        {/* Key Features / Highlights */}
        {magazine.highlights && magazine.highlights.length > 0 && (
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inside this Issue</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {magazine.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guarantees */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-6 text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>QRIS National Standard (NMID Certified)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-sky-500" />
            <span>Direct Gmail Account Library Sync</span>
          </div>
        </div>
      </div>
    </div>
  )
}
