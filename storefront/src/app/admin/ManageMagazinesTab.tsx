"use client"

import React, { useState } from "react"
import { Magazine, Category } from "../../lib/types"
import { formatRupiah } from "../../lib/format"
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Sparkles,
  UploadCloud,
  Check,
  X,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react"

interface ManageMagazinesTabProps {
  magazines: Magazine[]
  categories: Category[]
  onRefresh: () => void
  onSwitchToUpload: () => void
}

export default function ManageMagazinesTab({
  magazines,
  categories,
  onRefresh,
  onSwitchToUpload,
}: ManageMagazinesTabProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Edit Modal State
  const [editingMag, setEditingMag] = useState<Magazine | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState<"coverImage" | "pdfUrl" | null>(null)

  // Filter magazines
  const filtered = magazines.filter((mag) => {
    const matchesSearch =
      mag.title.toLowerCase().includes(search.toLowerCase()) ||
      (mag.issueNumber && mag.issueNumber.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = categoryFilter === "all" || mag.categoryId === categoryFilter
    return matchesSearch && matchesCat
  })

  // Open Edit Modal
  const handleOpenEdit = (mag: Magazine) => {
    setEditingMag({ ...mag, highlights: mag.highlights ? [...mag.highlights] : [] })
  }

  // Handle Edit Field Change
  const updateEditField = (field: keyof Magazine, value: any) => {
    if (!editingMag) return
    setEditingMag({ ...editingMag, [field]: value })
  }

  // Upload file for edit modal
  const handleEditFileUpload = async (field: "coverImage" | "pdfUrl", file: File) => {
    if (!editingMag) return
    setUploadingField(field)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      updateEditField(field, data.url)
    } catch (e: any) {
      alert("Failed to upload file to storage: " + e.message)
    } finally {
      setUploadingField(null)
    }
  }

  // AI Description Generator in Edit Modal
  const handleAiGenerate = async () => {
    if (!editingMag || !editingMag.title.trim()) {
      alert("Please enter a magazine title first before generating AI description.")
      return
    }

    setIsAiLoading(true)
    try {
      const categoryObj = categories.find((c) => c.id === editingMag.categoryId)
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingMag.title,
          category: categoryObj?.name || "Magazine",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEditingMag((prev) =>
          prev
            ? {
                ...prev,
                description: data.description || prev.description,
                highlights: data.highlights && data.highlights.length > 0 ? data.highlights : prev.highlights,
              }
            : null
        )
      }
    } catch (e: any) {
      alert("AI generation failed: " + e.message)
    } finally {
      setIsAiLoading(false)
    }
  }

  // Save changes to API
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMag) return

    if (!editingMag.title.trim()) {
      alert("Title is required.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/magazines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMag),
      })

      if (res.ok) {
        setEditingMag(null)
        onRefresh()
      } else {
        const data = await res.json()
        alert("Failed to save changes: " + (data.error || "Unknown error"))
      }
    } catch (e: any) {
      alert("Error saving magazine: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete magazine
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return

    try {
      const res = await fetch("/api/magazines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        onRefresh()
      } else {
        alert("Failed to delete magazine.")
      }
    } catch (e: any) {
      alert("Error deleting magazine: " + e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Published Digital Magazines ({magazines.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, search, edit details, or remove existing digital issues from your storefront.
          </p>
        </div>

        <button
          onClick={onSwitchToUpload}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Issue</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search publications by title or edition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
          >
            <option value="all">All Categories ({magazines.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Magazines Table / List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No magazines match your current search or category filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Cover (3:4)</th>
                  <th className="py-3.5 px-4">Title & Edition</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">PDF Asset</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((mag) => (
                  <tr key={mag.id} className="hover:bg-slate-50/50">
                    {/* Cover Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="w-12 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                        <img
                          src={mag.coverImage}
                          alt={mag.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* Title & Edition */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{mag.title}</div>
                      <div className="text-[11px] text-slate-500">{mag.issueNumber || "Standard Edition"}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {mag.categoryName || "General"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatRupiah(mag.price)}
                    </td>

                    {/* PDF Asset Status */}
                    <td className="py-3 px-4">
                      {mag.pdfUrl ? (
                        <a
                          href={mag.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-[11px] font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF Linked</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-rose-500 font-semibold text-[11px] flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>No PDF</span>
                        </span>
                      )}
                    </td>

                    {/* Action Buttons: Edit & Delete */}
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(mag)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-bold text-xs transition"
                        title="Edit Magazine Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(mag.id, mag.title)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition"
                        title="Delete Magazine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EDIT MAGAZINE MODAL */}
      {/* ===================================================================== */}
      {editingMag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 my-8">
            <button
              onClick={() => setEditingMag(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Publication Editor
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Edit Digital Magazine Issue
              </h3>
              <p className="text-xs text-slate-500">
                Update cover art, digital PDF download link, pricing, or description.
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Title */}
                <div className="md:col-span-8 space-y-1">
                  <label className="block font-bold text-slate-700">Magazine Title *</label>
                  <input
                    type="text"
                    required
                    value={editingMag.title}
                    onChange={(e) => updateEditField("title", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Issue Number */}
                <div className="md:col-span-4 space-y-1">
                  <label className="block font-bold text-slate-700">Issue / Edition</label>
                  <input
                    type="text"
                    value={editingMag.issueNumber || ""}
                    onChange={(e) => updateEditField("issueNumber", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div className="md:col-span-6 space-y-1">
                  <label className="block font-bold text-slate-700">Category *</label>
                  <select
                    value={editingMag.categoryId}
                    onChange={(e) => updateEditField("categoryId", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="md:col-span-6 space-y-1">
                  <label className="block font-bold text-slate-700">Price (IDR Rp) *</label>
                  <input
                    type="number"
                    required
                    value={editingMag.price}
                    onChange={(e) => updateEditField("price", Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Cover Image */}
                <div className="md:col-span-12 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Cover Image (3:4 Portrait Ratio)
                    </label>
                    <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {uploadingField === "coverImage" ? "Uploading to S3..." : "Upload New Cover to S3"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={Boolean(uploadingField)}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleEditFileUpload("coverImage", file)
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingMag.coverImage && (
                      <img
                        src={editingMag.coverImage}
                        alt="Preview"
                        className="w-10 h-14 object-cover rounded border border-slate-200"
                      />
                    )}
                    <input
                      type="text"
                      value={editingMag.coverImage}
                      onChange={(e) => updateEditField("coverImage", e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* PDF Link */}
                <div className="md:col-span-12 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Digital PDF Link
                    </label>
                    <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {uploadingField === "pdfUrl" ? "Uploading to S3..." : "Upload New PDF to S3"}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={Boolean(uploadingField)}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleEditFileUpload("pdfUrl", file)
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingMag.pdfUrl || ""}
                      onChange={(e) => updateEditField("pdfUrl", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {editingMag.pdfUrl && (
                      <a
                        href={editingMag.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Open PDF"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Description + AI Fill */}
                <div className="md:col-span-12 space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Editorial Description
                    </label>
                    <button
                      type="button"
                      onClick={handleAiGenerate}
                      disabled={isAiLoading || !editingMag.title}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-sm transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAiLoading ? "AI Generating..." : "✨ AI Re-generate"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={editingMag.description || ""}
                    onChange={(e) => updateEditField("description", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMag(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold transition shadow flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
