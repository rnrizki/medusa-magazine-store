"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Magazine } from "../lib/types"
import { formatRupiah } from "../lib/format"
import { useCart } from "../lib/cart-context"
import { ShoppingBag, Check, BookOpen, Sparkles } from "lucide-react"

interface MagazineCardProps {
  magazine: Magazine
}

export default function MagazineCard({ magazine }: MagazineCardProps) {
  const { addItem, isInCart } = useCart()
  const inCart = isInCart(magazine.id)
  const [justAdded, setJustAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!inCart) {
      addItem(magazine)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
    }
  }

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* 3:4 Magazine Cover Portrait Container */}
      <Link href={`/magazine/${magazine.id}`} className="block relative">
        <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
          {magazine.coverImage ? (
            <img
              src={magazine.coverImage}
              alt={magazine.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <BookOpen className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs">Digital Magazine Cover</span>
            </div>
          )}

          {/* Gradient Shadow Overlay for Magazine Spine Effect */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
            {magazine.categoryName && (
              <span className="bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                {magazine.categoryName}
              </span>
            )}

            <span className="bg-emerald-500/95 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
              Digital PDF
            </span>
          </div>

          {/* Bottom Price Tag on Cover */}
          <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-white/20 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-lg">
            {formatRupiah(magazine.price)}
          </div>
        </div>

        {/* Magazine Metadata */}
        <div className="p-4 space-y-1.5">
          {magazine.issueNumber && (
            <p className="text-[11px] font-medium text-indigo-600 uppercase tracking-wider">
              {magazine.issueNumber}
            </p>
          )}

          <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {magazine.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 pt-1 font-light leading-relaxed">
            {magazine.description}
          </p>
        </div>
      </Link>

      {/* Action Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
            inCart || justAdded
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-900 text-white hover:bg-indigo-600 active:scale-[0.98]"
          }`}
        >
          {inCart || justAdded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>In Your Bag</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add to Bag</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
