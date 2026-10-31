"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Loader2, X, Zap, ArrowRight } from "lucide-react"
import { Magazine } from "../lib/types"

interface MagazineSearchBarProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export default function MagazineSearchBar({
  placeholder = "Search magazines (Meilisearch)...",
  className = "",
  autoFocus = false,
}: MagazineSearchBarProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionHits, setSuggestionHits] = useState<Magazine[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search to Meilisearch API for live suggestions
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setShowSuggestions(false)
      setSuggestionHits([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/magazines?search=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.magazines)) {
            setSuggestionHits(data.magazines.slice(0, 5))
          }
        }
      } catch (e) {
        console.warn("Search bar fetch error:", e)
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleInputChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length > 0) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const q = searchQuery.trim()
    setShowSuggestions(false)
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`)
    } else {
      router.push("/")
    }
  }

  const handleClear = () => {
    setSearchQuery("")
    setShowSuggestions(false)
    setSuggestionHits([])
  }

  return (
    <div ref={searchContainerRef} className={`relative w-full ${className}`}>
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative w-full flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          autoFocus={autoFocus}
          onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            } else if (e.key === "Escape") {
              setShowSuggestions(false)
            }
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white transition"
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin mr-1" />
          )}

          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Floating Suggestions Dropdown */}
      {showSuggestions && searchQuery.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-500" />
              Suggestions for &ldquo;{searchQuery}&rdquo;
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-bold">
              Meilisearch
            </span>
          </div>

          {suggestionHits.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No magazines found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div className="py-1 max-h-80 overflow-y-auto">
              {suggestionHits.map((item) => (
                <Link
                  key={item.id}
                  href={`/magazine/${item.id}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-50 transition group"
                >
                  <div className="w-9 h-12 flex-shrink-0 bg-slate-900 rounded-md overflow-hidden relative border border-slate-200">
                    <img
                      src={item.thumbnailUrl || item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.categoryName && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {item.categoryName}
                        </span>
                      )}
                      {item.issueNumber && (
                        <span className="text-[10px] text-indigo-500 font-medium">
                          {item.issueNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-slate-900">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="p-2 bg-slate-50/80 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center justify-center space-x-1 mx-auto"
            >
              <span>Tampilkan semua hasil di katalog utama</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
