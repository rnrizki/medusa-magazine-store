"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Magazine } from "../lib/types"
import { formatRupiah } from "../lib/format"
import { useCart } from "../lib/cart-context"
import { getCategoryTheme } from "../lib/category-colors"
import { getMagazineThumbnail } from "../lib/thumbnails"
import { ShoppingCart, Check, BookOpen, Sparkles } from "lucide-react"

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
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between [contain:paint]">
      {/* 3:4 Magazine Cover Portrait Container */}
      <Link href={`/magazine/${magazine.id}`} className="block relative">
        <div className="relative aspect-[3/4] w-full bg-slate-900 overflow-hidden">
          {magazine.coverImage || magazine.thumbnailUrl ? (
            <img
              src={getMagazineThumbnail(magazine)}
              alt={magazine.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
              <BookOpen className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-xs">Digital Magazine Cover</span>
            </div>
          )}

          {/* Gradient Shadow Overlay for Magazine Spine Effect */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

          {/* Bottom Cover Bar: File Size (Left) and Price (Right) */}
          <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
            {/* File Size Badge (Bottom Left, replacing category) */}
            <div className="flex items-center">
              <span
                title={`File Size: ${magazine.fileSize ? `${magazine.fileSize} MB` : "50 MB"}`}
                className="bg-emerald-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap"
              >
                {magazine.fileSize ? `${magazine.fileSize} MB` : "50 MB"}
              </span>
            </div>

            {/* Price Tag (Bottom Right) */}
            <div className="ml-auto bg-slate-950/90 border border-white/20 text-white font-black text-xs px-2 py-0.5 rounded-md shadow-md whitespace-nowrap flex-shrink-0">
              {formatRupiah(magazine.price)}
            </div>
          </div>
        </div>

        {/* Magazine Metadata */}
        <div className="p-4 space-y-1.5">
          {/* Category Label replacing VOL. 1 • 2026 / Issue Number */}
          {magazine.categoryName && (() => {
            const theme = getCategoryTheme(magazine.categoryName)
            return (
              <div className="flex items-center">
                <span
                  style={theme.badgeStyle}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs inline-block truncate max-w-full"
                >
                  {magazine.categoryName}
                </span>
              </div>
            )
          })()}

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
              : "bg-[#D97706] text-white hover:bg-[#B45309] shadow-amber-600/20 active:scale-[0.98]"
          }`}
        >
          {inCart || justAdded ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>In Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
