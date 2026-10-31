import React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getMagazineById, getMagazines } from "../../../lib/db"
import { getRelatedMagazines } from "../../../lib/recommendations"
import MagazineDetailClient from "./MagazineDetailClient"
import RelatedMagazinesCarousel from "../../../components/RelatedMagazinesCarousel"
import MagazineSearchBar from "../../../components/MagazineSearchBar"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props {
  params: {
    id: string
  }
}

export default function MagazineDetailPage({ params }: Props) {
  const magazine = getMagazineById(params.id)

  if (!magazine) {
    notFound()
  }

  const allMagazines = getMagazines()
  const relatedItems = getRelatedMagazines(magazine, allMagazines)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar: Back to all magazines & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to all magazines
        </Link>

        <div className="w-full sm:w-80 md:w-96">
          <MagazineSearchBar placeholder="Search magazines (Meilisearch)..." />
        </div>
      </div>

      <MagazineDetailClient magazine={magazine} />

      <RelatedMagazinesCarousel
        relatedItems={relatedItems}
        categoryName={magazine.categoryName}
      />
    </div>
  )
}
