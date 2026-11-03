"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { Category, Magazine } from "../lib/types"
import { getCategoryTheme } from "../lib/category-colors"
import { getPaginationItems, formatPageNumber } from "../lib/pagination"
import { getMagazineThumbnail } from "../lib/thumbnails"
import { sortMagazinesLatestFirst } from "../lib/magazineSort"
import MagazineCard from "./MagazineCard"
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react"

interface MagazineCatalogProps {
  initialCategories: Category[]
  initialMagazines: Magazine[]
}

const ITEMS_PER_PAGE = 24

export default function MagazineCatalog({
  initialCategories,
  initialMagazines,
}: MagazineCatalogProps) {
  const [categories] = useState<Category[]>(initialCategories)
  const [magazines] = useState<Magazine[]>(initialMagazines)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // searchQuery: input text & floating suggestion popover (does NOT touch main grid)
  const [searchQuery, setSearchQuery] = useState("")
  // appliedQuery: search filter applied to the main catalog grid (only updates on submit / Enter / select)
  const [appliedQuery, setAppliedQuery] = useState("")
  
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [searchResults, setSearchResults] = useState<Magazine[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchSource, setSearchSource] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionHits, setSuggestionHits] = useState<Magazine[]>([])
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

  // Fast live suggestions for autocomplete popover (debounced to Meilisearch)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setShowSuggestions(false)
      setSuggestionHits([])
      setIsSearching(false)
      return
    }

    // Instant local top 5 while waiting for network response
    const localTop5 = sortMagazinesLatestFirst(
      magazines.filter((m) => {
        const matchCat =
          selectedCategory === "all" ||
          m.categoryId === selectedCategory ||
          (m.categoryName &&
            m.categoryName.toLowerCase() === selectedCategory.toLowerCase())
        const matchText =
          m.title.toLowerCase().includes(q.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(q.toLowerCase()))
        return matchCat && matchText
      })
    ).slice(0, 5)

    setSuggestionHits(localTop5)
    setIsSearching(true)

    const timer = setTimeout(async () => {
      try {
        const catParam =
          selectedCategory !== "all"
            ? `&category=${encodeURIComponent(selectedCategory)}`
            : ""
        const res = await fetch(
          `/api/magazines?search=${encodeURIComponent(q)}${catParam}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data && Array.isArray(data.magazines)) {
            setSuggestionHits(data.magazines.slice(0, 5))
            setSearchSource(data.source || "meilisearch")
          }
        }
      } catch (e) {
        console.warn("Suggestion fetch error:", e)
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, magazines])

  // Fetch full search results whenever appliedQuery or category changes
  useEffect(() => {
    if (!appliedQuery.trim()) {
      setSearchResults(null)
      return
    }

    let isMounted = true
    const fetchApplied = async () => {
      try {
        const catParam =
          selectedCategory !== "all"
            ? `&category=${encodeURIComponent(selectedCategory)}`
            : ""
        const res = await fetch(
          `/api/magazines?search=${encodeURIComponent(appliedQuery)}${catParam}`
        )
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data && Array.isArray(data.magazines)) {
            setSearchResults(data.magazines)
            setSearchSource(data.source || "meilisearch")
          }
        }
      } catch (e) {
        console.warn("Applied search fetch error:", e)
      }
    }

    fetchApplied()
    return () => {
      isMounted = false
    }
  }, [appliedQuery, selectedCategory])

  // Listen for reset events (e.g. clicking logo or home link while already on home)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const p = parseInt(params.get("page") || "1", 10)
      if (p > 1) {
        setCurrentPage(p)
      }
      const s = params.get("search")
      if (s && s.trim()) {
        setSearchQuery(s.trim())
        setAppliedQuery(s.trim())
      }
    }

    const handleResetHome = () => {
      setSelectedCategory("all")
      setSearchQuery("")
      setAppliedQuery("")
      setSearchResults(null)
      setShowSuggestions(false)
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
        const s = params.get("search") || ""
        setSearchQuery(s)
        setAppliedQuery(s)
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

  // Handle typing in search input (only opens suggestions popover, keeps grid below still)
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text)
    if (text.trim().length > 0) {
      setShowSuggestions(true)
    } else {
      // Clearing input clears applied filter on the grid as well
      setShowSuggestions(false)
      setAppliedQuery("")
      setSearchResults(null)
      setCurrentPage(1)
    }
  }

  // Explicitly apply search to the main catalog grid
  const applySearch = (targetQuery?: string) => {
    const q = (typeof targetQuery === "string" ? targetQuery : searchQuery).trim()
    setAppliedQuery(q)
    setShowSuggestions(false)
    setCurrentPage(1)
    if (typeof window !== "undefined") {
      const url = q ? `/?search=${encodeURIComponent(q)}` : "/"
      window.history.pushState(null, "", url)
    }
  }

  // Clear search filter
  const clearSearch = () => {
    setSearchQuery("")
    setAppliedQuery("")
    setSearchResults(null)
    setShowSuggestions(false)
    setCurrentPage(1)
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/")
    }
  }

  // Filter and sort magazines strictly from latest upload to oldest
  const filteredMagazines = useMemo(() => {
    let list: Magazine[] = []
    if (appliedQuery.trim() !== "") {
      if (searchResults !== null) {
        list = [...searchResults]
      } else {
        const q = appliedQuery.toLowerCase()
        list = magazines.filter((mag) => {
          const matchesCategory =
            selectedCategory === "all" ||
            mag.categoryId === selectedCategory ||
            (mag.categoryName &&
              mag.categoryName.toLowerCase() === selectedCategory.toLowerCase())
          const matchesText =
            mag.title.toLowerCase().includes(q) ||
            (mag.description && mag.description.toLowerCase().includes(q))
          return matchesCategory && matchesText
        })
      }
    } else if (selectedCategory === "all") {
      list = [...magazines]
    } else {
      list = magazines.filter(
        (m) =>
          m.categoryId === selectedCategory ||
          (m.categoryName &&
            m.categoryName.toLowerCase() === selectedCategory.toLowerCase())
      )
    }

    return sortMagazinesLatestFirst(list)
  }, [appliedQuery, searchResults, magazines, selectedCategory])

  // Pagination calculation (strictly 20 magazines per page)
  const totalItems = filteredMagazines.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems)
  const paginatedMagazines = filteredMagazines.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

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
    <div className="space-y-6">
      {/* Sticky Mobile Search Bar (Top-16 right below header) */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-2 sm:py-0 bg-slate-50 sm:bg-transparent border-b border-slate-200/80 sm:border-b-0 transition-all shadow-xs sm:shadow-none">
        <div
          ref={searchContainerRef}
          className="relative w-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs p-2 sm:p-2.5"
        >
          {/* Search Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              applySearch()
            }}
            className="relative w-full flex items-center"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search magazines (Meilisearch)..."
              value={searchQuery}
              onFocus={() =>
                searchQuery.trim().length > 0 && setShowSuggestions(true)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  applySearch()
                } else if (e.key === "Escape") {
                  setShowSuggestions(false)
                }
              }}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full pl-9 pr-20 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white transition"
            />

            {/* Action Buttons inside Input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin mr-1" />
              )}

              {searchQuery.trim().length > 0 && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                aria-label="Submit search"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Instant Floating Suggestions Popover (Autoclose on click) */}
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
                          src={getMagazineThumbnail(item)}
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
                  onClick={() => applySearch(searchQuery)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center justify-center space-x-1 mx-auto"
                >
                  <span>Tampilkan semua hasil di grid bawah</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills & Active Search Info Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">

        {/* Active Applied Search Filter Pill */}
        {appliedQuery && (
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs text-indigo-950">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-indigo-700">Filter Aktif:</span>
              <span className="font-bold">&ldquo;{appliedQuery}&rdquo;</span>
              <span className="text-indigo-500">
                ({filteredMagazines.length} majalah ditemukan)
              </span>
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/60 font-semibold text-[11px] transition shadow-2xs"
            >
              <X className="w-3 h-3" />
              Reset Pencarian
            </button>
          </div>
        )}

        {/* Category Badges with Unique Earth Tone Color Palette */}
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const allTheme = getCategoryTheme("all")
            const isAllSelected = selectedCategory === "all"
            return (
              <button
                onClick={() => handleCategorySelect("all")}
                style={isAllSelected ? allTheme.activeStyle : allTheme.inactiveStyle}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border inline-flex items-center space-x-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: isAllSelected ? ((allTheme.activeStyle.color as string) || "#FFFFFF") : allTheme.dotColor }}
                />
                <span>All Magazines ({magazines.length})</span>
              </button>
            )
          })()}

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

            const theme = getCategoryTheme(cat.slug || cat.name)

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={isSelected ? theme.activeStyle : theme.inactiveStyle}
                className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs border inline-flex items-center space-x-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: isSelected ? ((theme.activeStyle.color as string) || "#FFFFFF") : theme.dotColor }}
                />
                <span>
                  {cat.name} ({count})
                </span>
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
            {appliedQuery
              ? `No magazines match "${appliedQuery}". Try a different keyword.`
              : "No issues available in this category yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
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

              <div className="flex items-center space-x-1.5 flex-wrap justify-center">
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

                {/* Page Number Buttons (Windowed: 3 before & 3 after) */}
                {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                  if (item === "...") {
                    return (
                      <span
                        key={`dots-${idx}`}
                        className="w-7 h-9 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
                      >
                        ...
                      </span>
                    )
                  }
                  const pageNum = item as number
                  const isCurrent = currentPage === pageNum
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        isCurrent
                          ? "bg-slate-900 text-white shadow"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                      }`}
                    >
                      {formatPageNumber(pageNum, totalPages)}
                    </button>
                  )
                })}

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
