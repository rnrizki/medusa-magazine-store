"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { Category, Magazine } from "../lib/types"
import MagazineCard from "./MagazineCard"
import { BookOpen, Search, ChevronLeft, ChevronRight, Sparkles, Loader2, ArrowRight } from "lucide-react"

interface MagazineCatalogProps {
  initialCategories: Category[]
  initialMagazines: Magazine[]
}

const ITEMS_PER_PAGE = 20

export default function MagazineCatalog({
  initialCategories,
  initialMagazines,
}: MagazineCatalogProps) {
  const [categories] = useState<Category[]>(initialCategories)
  const [magazines] = useState<Magazine[]>(initialMagazines)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [paradeResults, setParadeResults] = useState<Magazine[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchSource, setSearchSource] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
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

  // Instant top 5 suggestions (matches immediately while typing)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    if (paradeResults !== null && paradeResults.length > 0) {
      return paradeResults.slice(0, 5)
    }
    const q = searchQuery.toLowerCase().trim()
    return magazines
      .filter((m) => {
        const matchCat =
          selectedCategory === "all" ||
          m.categoryId === selectedCategory ||
          (m.categoryName &&
            m.categoryName.toLowerCase() === selectedCategory.toLowerCase())
        const matchText =
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
        return matchCat && matchText
      })
      .slice(0, 5)
  }, [searchQuery, paradeResults, magazines, selectedCategory])

  // Debounced search to ParadeDB BM25 API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setParadeResults(null)
      setSearchSource(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const catParam =
          selectedCategory !== "all"
            ? `&category=${encodeURIComponent(selectedCategory)}`
            : ""
        const res = await fetch(
          `/api/magazines?search=${encodeURIComponent(searchQuery)}${catParam}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.magazines)) {
            setParadeResults(data.magazines)
            setSearchSource(data.source || "paradedb-bm25")
          }
        }
      } catch (e) {
        console.warn("Search fetch error, staying on local fallback:", e)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  // Listen for reset events (e.g. clicking logo or home link while already on home)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const p = parseInt(params.get("page") || "1", 10)
      if (p > 1) {
        setCurrentPage(p)
      }
    }

    const handleResetHome = () => {
      setSelectedCategory("all")
      setSearchQuery("")
      setCurrentPage(1)
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", "/")
      }
      const element = document.getElementById("magazine-catalog-section")
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        const p = parseInt(params.get("page") || "1", 10)
        setCurrentPage(p >= 1 ? p : 1)
      }
    }

    window.addEventListener("reset-catalog-home", handleResetHome)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("reset-catalog-home", handleResetHome)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Handle category change (resets pagination to page 1)
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/")
    }
  }

  // Handle search query change (resets pagination to page 1)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setShowSuggestions(query.trim().length > 0)
    setCurrentPage(1)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/")
    }
  }

  // Filter magazines by category and search keywords (using ParadeDB BM25 when available)
  const filteredMagazines =
    paradeResults !== null
      ? paradeResults
      : magazines.filter((mag) => {
          const matchesCategory =
            selectedCategory === "all" ||
            mag.categoryId === selectedCategory ||
            (mag.categoryName &&
              mag.categoryName.toLowerCase() === selectedCategory.toLowerCase())

          const matchesSearch =
            searchQuery.trim() === "" ||
            mag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mag.description &&
              mag.description.toLowerCase().includes(searchQuery.toLowerCase()))

          return matchesCategory && matchesSearch
        })

  // Pagination calculation (strictly 20 magazines per page)
  const totalItems = filteredMagazines.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems)
  const paginatedMagazines = filteredMagazines.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Navigate between pages with smooth scroll up to catalog
  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
    if (typeof window !== "undefined") {
      const url = pageNumber === 1 ? "/" : `/?page=${pageNumber}`
      window.history.pushState(null, "", url)
    }
    const element = document.getElementById("magazine-catalog-section")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="space-y-8">
      {/* Category Pills (Two-Row Wrap View, No Slider) & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Browse by Category:
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({categories.length} Official Categories)
            </span>
          </div>

          <div ref={searchContainerRef} className="relative w-full sm:w-80 flex flex-col items-end">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search magazines (ParadeDB BM25)..."
                value={searchQuery}
                onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    setShowSuggestions(false)
                  }
                }}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white transition"
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : searchQuery && searchSource === "paradedb-bm25" ? (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
              ) : null}
            </div>

            {searchQuery && searchSource === "paradedb-bm25" && (
              <span className="text-[10px] text-indigo-600 font-semibold tracking-wider flex items-center gap-1 mt-1">
                <Sparkles className="w-2.5 h-2.5" />
                ParadeDB BM25 Ranked
              </span>
            )}

            {/* Instant Floating Suggestions Popover */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Suggestions for &ldquo;{searchQuery}&rdquo;
                  </span>
                  {searchSource === "paradedb-bm25" && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-bold">
                      BM25
                    </span>
                  )}
                </div>

                {suggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching magazines found for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {suggestions.map((item) => (
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
                    onClick={() => setShowSuggestions(false)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center justify-center space-x-1 mx-auto"
                  >
                    <span>View all {filteredMagazines.length} issues in grid below</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2-Row Visible Category Badges (No Slider / No Horizontal Scrollbar) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCategorySelect("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Magazines ({magazines.length})
          </button>

          {categories.map((cat) => {
            const count = magazines.filter(
              (m) =>
                m.categoryId === cat.id ||
                (m.categoryName &&
                  m.categoryName.toLowerCase() === cat.name.toLowerCase())
            ).length

            const isSelected =
              selectedCategory === cat.id ||
              selectedCategory.toLowerCase() === cat.name.toLowerCase()

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* 3:4 Magazine Grid (20 items per page) */}
      {filteredMagazines.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            No magazines found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No magazines match "${searchQuery}". Try a different keyword.`
              : "No issues available in this category yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedMagazines.map((mag) => (
              <MagazineCard key={mag.id} magazine={mag} />
            ))}
          </div>

          {/* Pagination Controls (Every page serves up to 20 magazines) */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{startIndex + 1}</span>–
                <span className="font-bold text-slate-800">{endIndex}</span> of{" "}
                <span className="font-bold text-slate-800">{totalItems}</span> magazines • Page{" "}
                <span className="font-bold text-slate-800">{currentPage}</span> of{" "}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </p>

              <div className="flex items-center space-x-1.5">
                {/* Previous Page Button */}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      currentPage === pageNum
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Page Button */}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
