"use client"

import React, { useState } from "react"
import { Category, Magazine } from "../lib/types"
import MagazineCard from "./MagazineCard"
import { BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react"

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

  // Handle category change (resets pagination to page 1)
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  // Handle search query change (resets pagination to page 1)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Filter magazines by category and search keywords
  const filteredMagazines = magazines.filter((mag) => {
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

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search magazine titles..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white transition"
            />
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
