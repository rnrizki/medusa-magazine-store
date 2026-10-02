"use client"

import React, { useState, useEffect } from "react"
import { Category, Magazine } from "../lib/types"
import MagazineCard from "./MagazineCard"
import { BookOpen, Layers, Sparkles, Filter, SlidersHorizontal, Plus } from "lucide-react"
import Link from "next/link"

interface MagazineCatalogProps {
  initialCategories: Category[]
  initialMagazines: Magazine[]
}

export default function MagazineCatalog({
  initialCategories,
  initialMagazines,
}: MagazineCatalogProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [magazines, setMagazines] = useState<Magazine[]>(initialMagazines)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter magazines
  const filteredMagazines = magazines.filter((mag) => {
    const matchesCategory =
      selectedCategory === "all" || mag.categoryId === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      mag.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mag.description &&
        mag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-10">
      {/* Category Pills & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Scrollable Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Magazines ({magazines.length})
          </button>

          {categories.map((cat) => {
            const count = magazines.filter((m) => m.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Search input & Admin link */}
        <div className="flex items-center space-x-2 w-full md:w-auto flex-shrink-0">
          <input
            type="text"
            placeholder="Search magazine titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-56 px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />

          <Link
            href="/admin"
            className="p-2 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Manage Categories & Magazines in Admin"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3:4 Magazine Grid */}
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
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Magazines in Admin</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMagazines.map((mag) => (
            <MagazineCard key={mag.id} magazine={mag} />
          ))}
        </div>
      )}
    </div>
  )
}
