import React from "react"
import { getCategories, getMagazines } from "../lib/db"
import MagazineCatalog from "../components/MagazineCatalog"

export const dynamic = "force-dynamic"

export default function HomePage() {
  const categories = getCategories()
  const magazines = getMagazines()

  return (
    <div className="py-8 sm:py-10 pb-20">
      {/* Main Magazine Catalog */}
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
