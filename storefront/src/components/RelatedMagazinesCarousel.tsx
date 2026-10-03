"use client"

import React, { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { RelatedMagazineItem } from "../lib/recommendations"
import { formatRupiah } from "../lib/format"
import { useCart } from "../lib/cart-context"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react"

interface RelatedMagazinesCarouselProps {
  relatedItems: RelatedMagazineItem[]
  categoryName?: string
}

export default function RelatedMagazinesCarousel({
  relatedItems,
  categoryName,
}: RelatedMagazinesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const { addItem, isInCart } = useCart()
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      return () => container.removeEventListener("scroll", checkScroll)
    }
  }, [relatedItems])

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 300
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const handleAdd = (e: React.MouseEvent, mag: RelatedMagazineItem["magazine"]) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isInCart(mag.id)) {
      addItem(mag)
      setAddedIds((prev) => ({ ...prev, [mag.id]: true }))
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [mag.id]: false }))
      }, 1800)
    }
  }

  if (!relatedItems || relatedItems.length === 0) {
    return null
  }

  return (
    <section className="mt-16 pt-12 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended For You</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Related Magazines & Issues
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Handpicked 5 related issues: 2 similar titles & 3 from {categoryName || "this category"}.
          </p>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-2.5 rounded-full border transition-all ${
              canScrollLeft
                ? "border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
                : "border-slate-200 text-slate-300 cursor-not-allowed opacity-50"
            }`}
            aria-label="Previous magazine"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-2.5 rounded-full border transition-all ${
              canScrollRight
                ? "border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
                : "border-slate-200 text-slate-300 cursor-not-allowed opacity-50"
            }`}
            aria-label="Next magazine"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {relatedItems.map(({ magazine, matchReason, matchLabel }) => {
          const inCart = isInCart(magazine.id)
          const justAdded = addedIds[magazine.id]

          return (
            <div
              key={magazine.id}
              className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <Link href={`/magazine/${magazine.id}`} className="block relative">
                {/* 3:4 Magazine Cover Portrait */}
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
                      <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs">Digital Magazine Cover</span>
                    </div>
                  )}

                  {/* Magazine Spine Shadow */}
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                  {/* Match Reason Badge */}
                  <div className="absolute top-3 left-3 pointer-events-none">
                    {matchReason === "similar_title" ? (
                      <span className="bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Similar Title</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow flex items-center space-x-1">
                        <Layers className="w-3 h-3" />
                        <span>Same Category</span>
                      </span>
                    )}
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-white/20 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-lg">
                    {formatRupiah(magazine.price)}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-1">
                  {magazine.issueNumber && (
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                      {magazine.issueNumber}
                    </p>
                  )}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {magazine.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 pt-0.5 font-light leading-relaxed">
                    {magazine.description}
                  </p>
                </div>
              </Link>

              {/* Action Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={(e) => handleAdd(e, magazine)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                    inCart || justAdded
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-900 text-white hover:bg-indigo-600 active:scale-[0.98]"
                  }`}
                >
                  {inCart || justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Bag</span>
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
        })}
      </div>
    </section>
  )
}
