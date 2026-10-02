"use client"

import React, { useState, useEffect } from "react"
import { Category, Magazine, Order } from "../../lib/types"
import { formatRupiah } from "../../lib/db"
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  BookOpen,
  QrCode,
  Image as ImageIcon,
  Check,
  AlertCircle,
  UploadCloud,
  FileCheck,
  RefreshCw,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import AdminChatTab from "./AdminChatTab"

export default function AdminStudioPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "upload" | "categories" | "qris" | "chat">("orders")

  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  // Inspection Modal for Screenshot Proof
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null)

  // Category Form State
  const [newCatName, setNewCatName] = useState("")
  const [newCatDesc, setNewCatDesc] = useState("")

  // Multi-Add / Bulk Upload Magazines State
  interface BulkItem {
    id: string
    title: string
    issueNumber: string
    categoryId: string
    price: number
    coverImage: string
    description: string
    highlights: string[]
    pdfUrl: string
    isAiLoading?: boolean
  }

  const [bulkItems, setBulkItems] = useState<BulkItem[]>([
    {
      id: "item_1",
      title: "",
      issueNumber: "Vol. 1 • 2026",
      categoryId: "",
      price: 45000,
      coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&h=800&q=85",
      description: "",
      highlights: [],
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
  ])

  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [isSubmittingMagazines, setIsSubmittingMagazines] = useState(false)

  // Load initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordRes, catRes, magRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/categories"),
        fetch("/api/magazines"),
      ])
      if (ordRes.ok) setOrders(await ordRes.json())
      if (catRes.ok) {
        const cats = await catRes.json()
        setCategories(cats)
        if (cats.length > 0 && !bulkItems[0].categoryId) {
          setBulkItems((prev) =>
            prev.map((i) => ({ ...i, categoryId: i.categoryId || cats[0].id }))
          )
        }
      }
      if (magRes.ok) setMagazines(await magRes.json())
    } catch (e) {
      console.error("Failed to load admin data", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Order Actions (Verify / Reject)
  const handleUpdateOrderStatus = async (orderId: string, status: "verified" | "rejected") => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        )
        if (selectedProofOrder && selectedProofOrder.id === orderId) {
          setSelectedProofOrder({ ...selectedProofOrder, status })
        }
      }
    } catch (e) {
      alert("Failed to update status")
    }
  }

  // Category Actions (Add / Delete)
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
      })
      if (res.ok) {
        const created = await res.json()
        setCategories((prev) => [...prev, created])
        setNewCatName("")
        setNewCatDesc("")
      }
    } catch (e) {
      alert("Failed to add category")
    }
  }

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this magazine category?")) return

    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catId }),
      })
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== catId))
      }
    } catch (e) {
      alert("Failed to delete category")
    }
  }

  // Multi-Add / Bulk Upload Row Management
  const addRow = () => {
    setBulkItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        title: "",
        issueNumber: "Vol. 1 • 2026",
        categoryId: categories[0]?.id || "",
        price: 45000,
        coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&h=800&q=85",
        description: "",
        highlights: [],
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    ])
  }

  const removeRow = (id: string) => {
    if (bulkItems.length === 1) return
    setBulkItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateBulkField = (id: string, field: keyof BulkItem, value: any) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  // AI Description Generator for a row
  const generateAiDescription = async (rowId: string) => {
    const item = bulkItems.find((i) => i.id === rowId)
    if (!item || !item.title.trim()) {
      alert("Please enter a magazine title first before generating description with AI.")
      return
    }

    updateBulkField(rowId, "isAiLoading", true)
    try {
      const categoryObj = categories.find((c) => c.id === item.categoryId)
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          category: categoryObj?.name || "Magazine",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBulkItems((prev) =>
          prev.map((i) =>
            i.id === rowId
              ? {
                  ...i,
                  description: data.description || "",
                  highlights: data.highlights || [],
                  isAiLoading: false,
                }
              : i
          )
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      updateBulkField(rowId, "isAiLoading", false)
    }
  }

  // Publish All Bulk Upload Magazines
  const handlePublishAll = async () => {
    // Validate
    const invalid = bulkItems.find((i) => !i.title.trim() || !i.categoryId)
    if (invalid) {
      alert("Please ensure all magazines have at least a Title and Category selected.")
      return
    }

    setIsSubmittingMagazines(true)
    try {
      const res = await fetch("/api/magazines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magazines: bulkItems }),
      })

      if (res.ok) {
        setUploadSuccess(true)
        fetchData()
        setTimeout(() => setUploadSuccess(false), 3000)
        // Reset to 1 row
        setBulkItems([
          {
            id: `item_${Date.now()}`,
            title: "",
            issueNumber: "Vol. 1 • 2026",
            categoryId: categories[0]?.id || "",
            price: 45000,
            coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&h=800&q=85",
            description: "",
            highlights: [],
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          },
        ])
      }
    } catch (e: any) {
      alert("Error uploading magazines: " + e.message)
    } finally {
      setIsSubmittingMagazines(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Store Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Digital Magazine Admin Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-upload products with AI descriptions, verify QRIS payment proofs, and organize categories.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "orders"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Orders & QRIS Proofs ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Multi-Add Upload (AI)
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "categories"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Categories ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab("qris")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "qris"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            QRIS Barcode
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === "chat"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Customer Chats</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: Orders & QRIS Payment Proof Verification */}
      {/* ===================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Customer Orders & QRIS Screenshots
            </h2>
            <button
              onClick={fetchData}
              className="p-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              No orders have been placed yet.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Order Code</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Gmail Account</th>
                      <th className="py-3.5 px-4">Issues</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Payment Proof</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {order.orderCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {order.customerName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {order.customerEmail}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {order.items.length} issue(s)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatRupiah(order.totalAmount)}
                        </td>

                        {/* Screenshot thumbnail / Preview button */}
                        <td className="py-3.5 px-4">
                          {order.paymentProofUrl ? (
                            <button
                              onClick={() => setSelectedProofOrder(order)}
                              className="flex items-center space-x-1.5 p-1 rounded-lg border border-slate-200 hover:border-indigo-500 bg-slate-50 transition"
                            >
                              <img
                                src={order.paymentProofUrl}
                                alt="Proof"
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span className="text-[11px] font-semibold text-indigo-600 flex items-center">
                                <Eye className="w-3 h-3 mr-0.5" /> View Proof
                              </span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              No screenshot attached
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {order.status === "verified" ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          ) : order.status === "rejected" ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>Pending Verification</span>
                            </span>
                          )}
                        </td>

                        {/* Approve / Reject Actions */}
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "verified")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition shadow-sm"
                            title="Approve QRIS & Unlock Digital PDF"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "rejected")}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-[11px] transition"
                            title="Reject Payment Proof"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: Multi-Add / Bulk Upload with AI Description Generator */}
      {/* ===================================================================== */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Add / Bulk Upload Magazines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add multiple digital magazine issues at once. Enter the title and click{" "}
                <span className="text-indigo-600 font-semibold">✨ AI Fill Description</span> to auto-generate editorial copy!
              </p>
            </div>

            <button
              onClick={addRow}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Magazine Row</span>
            </button>
          </div>

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Magazines successfully published to your storefront catalog!</span>
            </div>
          )}

          {/* Bulk Items Table/Cards */}
          <div className="space-y-6">
            {bulkItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      Magazine #{index + 1}
                    </span>
                  </div>

                  {bulkItems.length > 1 && (
                    <button
                      onClick={() => removeRow(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Row</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Title & Issue */}
                  <div className="md:col-span-6 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Magazine Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CYBERPUNK CHRONICLES - Issue #09"
                      value={item.title}
                      onChange={(e) => updateBulkField(item.id, "title", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Issue Number / Edition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vol. 12 • Fall 2026"
                      value={item.issueNumber}
                      onChange={(e) => updateBulkField(item.id, "issueNumber", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Category *
                    </label>
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateBulkField(item.id, "categoryId", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price & Cover (3:4 ratio) */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Price (IDR Rp) *
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateBulkField(item.id, "price", Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Cover Image URL (3:4 Portrait Ratio)
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={item.coverImage}
                      onChange={(e) => updateBulkField(item.id, "coverImage", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Digital PDF Download Link
                    </label>
                    <input
                      type="text"
                      placeholder="https://yourstorage.com/issue.pdf"
                      value={item.pdfUrl}
                      onChange={(e) => updateBulkField(item.id, "pdfUrl", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  {/* AI Description Field + Button */}
                  <div className="md:col-span-12 space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Editorial Description
                      </label>

                      <button
                        type="button"
                        onClick={() => generateAiDescription(item.id)}
                        disabled={item.isAiLoading || !item.title}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {item.isAiLoading ? "AI Generating..." : "✨ AI Fill Description from Title"}
                        </span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder="Click 'AI Fill Description from Title' or type your synopsis..."
                      value={item.description}
                      onChange={(e) => updateBulkField(item.id, "description", e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={addRow}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Row</span>
              </button>

              <button
                type="button"
                onClick={handlePublishAll}
                disabled={isSubmittingMagazines}
                className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-sm transition shadow-lg flex items-center space-x-2 disabled:bg-slate-400"
              >
                <span>
                  {isSubmittingMagazines ? "Publishing Issues..." : `Publish ${bulkItems.length} Magazine(s)`}
                </span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: Category Management (Add & Delete) */}
      {/* ===================================================================== */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Magazine Category Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize your publications into neat categories. Add new themes or remove old ones.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Add Category Form */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Create New Category
              </h3>

              <form onSubmit={handleAddCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photography & Film"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of this magazine genre..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shadow"
                >
                  Save Category
                </button>
              </form>
            </div>

            {/* Existing Categories List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Active Categories ({categories.length})
              </h3>

              <div className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const count = magazines.filter((m) => m.categoryId === cat.id).length
                  return (
                    <div
                      key={cat.id}
                      className="py-3 flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {cat.name}
                        </h4>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {count} publication(s)
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: QRIS Barcode Setup */}
      {/* ===================================================================== */}
      {activeTab === "qris" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              QRIS Payment Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your official QRIS barcode is displayed to customers at checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-48 aspect-square rounded-xl overflow-hidden border border-slate-200 shadow bg-white p-2">
              <img
                src="/qris.jpg"
                alt="Active QRIS Barcode"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Merchant Name:</span>
                <span className="font-bold text-slate-900 text-sm">
                  DIGITALPITSTOP - SOFTWARE
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NMID:</span>
                <span className="font-mono font-bold text-slate-900">
                  ID1026568992402 • A01
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status:</span>
                <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Active & Verified on Storefront</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: Live Customer Chats with Picture Upload & Product CTA Embedding */}
      {/* ===================================================================== */}
      {activeTab === "chat" && (
        <AdminChatTab magazines={magazines} />
      )}

      {/* ===================================================================== */}
      {/* Lightbox Modal: Inspect Customer Uploaded Payment Proof */}
      {/* ===================================================================== */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedProofOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                QRIS Verification
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Payment Proof for {selectedProofOrder.orderCode}
              </h3>
              <p className="text-xs text-slate-500">
                Customer: <strong>{selectedProofOrder.customerName}</strong> ({selectedProofOrder.customerEmail})
              </p>
            </div>

            {/* High-Res Screenshot Preview */}
            <div className="max-h-[450px] overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-2 text-center">
              {selectedProofOrder.paymentProofUrl ? (
                <img
                  src={selectedProofOrder.paymentProofUrl}
                  alt="Customer Screenshot Receipt"
                  className="mx-auto max-h-[420px] object-contain rounded"
                />
              ) : (
                <div className="py-12 text-slate-400 text-xs">No image provided</div>
              )}
            </div>

            {/* Approve / Reject Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs">
                <span className="text-slate-500">Order Amount: </span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatRupiah(selectedProofOrder.totalAmount)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedProofOrder.id, "rejected")
                    setSelectedProofOrder(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition"
                >
                  Reject Proof
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedProofOrder.id, "verified")
                    setSelectedProofOrder(null)
                  }}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Release Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
