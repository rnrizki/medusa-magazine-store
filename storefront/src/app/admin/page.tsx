"use client"

import React, { useState, useEffect } from "react"
import { Category, Magazine, Order } from "../../lib/types"
import { formatRupiah } from "../../lib/format"
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
  Lock,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
  Mail,
  Download,
  Package,
  FileSpreadsheet,
  Globe,
} from "lucide-react"
import AdminChatTab from "./AdminChatTab"
import ManageMagazinesTab from "./ManageMagazinesTab"
import { ALLOWED_CATEGORIES, normalizeToAllowedCategory } from "../../lib/categories"

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = []
  let currentLine = ""
  let insideQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      insideQuotes = !insideQuotes
      currentLine += char
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (currentLine.trim()) lines.push(currentLine.trim())
      currentLine = ""
      if (char === "\r" && text[i + 1] === "\n") i++
    } else {
      currentLine += char
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim())
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const values: string[] = []
    let val = ""
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') {
          val += '"'
          i++
        } else {
          inQuote = !inQuote
        }
      } else if (c === "," && !inQuote) {
        values.push(val.trim())
        val = ""
      } else {
        val += c
      }
    }
    values.push(val.trim())
    return values
  }

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))
  const records: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    const record: Record<string, string> = {}
    headers.forEach((h, idx) => {
      record[h] = values[idx] || ""
    })
    records.push(record)
  }
  return records
}

export default function AdminStudioPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "magazines" | "upload" | "categories" | "qris" | "chat">("orders")

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [loading, setLoading] = useState(true)

  // Inspection Modal for Screenshot Proof & Order Items
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null)
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2500)
  }

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
  const [uploadingField, setUploadingField] = useState<{ id: string; field: string } | null>(null)
  const [csvProcessing, setCsvProcessing] = useState(false)
  const [csvProgress, setCsvProgress] = useState<{
    current: number
    total: number
    currentTitle: string
    category?: string
  } | null>(null)
  const [csvImportMessage, setCsvImportMessage] = useState<string | null>(null)

  const handleFileUpload = async (rowId: string, field: "coverImage" | "pdfUrl", file: File) => {
    setUploadingField({ id: rowId, field })
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      updateBulkField(rowId, field, data.url)
    } catch (e: any) {
      alert("Failed to upload file to storage: " + e.message)
    } finally {
      setUploadingField(null)
    }
  }

  // Load initial data
  const fetchData = async () => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const [ordRes, catRes, magRes] = await Promise.all([
        fetch(`/api/orders?t=${timestamp}`, { cache: "no-store" }),
        fetch(`/api/categories?t=${timestamp}`, { cache: "no-store" }),
        fetch(`/api/magazines?t=${timestamp}`, { cache: "no-store" }),
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
    const saved = localStorage.getItem("medusa_admin_session")
    if (saved === "true") {
      setIsAuthenticated(true)
    }
    setAuthChecking(false)
    fetchData()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setIsLoggingIn(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setIsAuthenticated(true)
        localStorage.setItem("medusa_admin_session", "true")
      } else {
        setAuthError(data.error || "Invalid admin credentials. Please check your password.")
      }
    } catch (err: any) {
      setAuthError("Sign in failed: " + err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("medusa_admin_session")
  }

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

  // CSV Template Downloader
  const downloadCsvTemplate = () => {
    const headers = "title,issueNumber,category,price,coverImage,pdfUrl,description,highlights"
    const sampleRows = [
      `"VOGUE NOIR - Tokyo Streetwear Revolution","Issue #14 • Street Culture","Fashion",45000,"https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&h=800&q=85","https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf","","The Monochrome Aesthetic; Tokyo Underground Atelier; Streetwear High Fashion"`,
      `"QUANTUM FRONTIERS - Autonomous Neural Agents","Vol. 12 • 2026","Science",49000,"https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&h=800&q=85","","","Agentic Coding Systems; Neural Memory; Ethical AI Guardrails"`,
      `"GLOBAL DEFENSE REVIEW - 6th Gen Stealth Dynamics","Briefing 2026","Defense",52000,"https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&h=800&q=85","","","Stealth Airframes; Hypersonic Interceptors; Naval Drone Fleets"`,
      `"APEX TRACKDAY - Porsche 911 GT3 RS Special","Motorsport Vol. 19","Automotive",55000,"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&h=800&q=85","","","Spa-Francorchamps Telemetry; High-G Suspension; Carbon Ceramic Brakes"`,
      `"FORBES VENTURE - The Billion Dollar Seed Stage","Q4 2026 Edition","Business",48000,"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&h=800&q=85","","","Seed Stage Valuations; AI Startup Scaling; Founder Perspectives"`,
      `"WANDERLUST BALI - Secret Island Sanctuaries","Travel Issue #08","Travel",45000,"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&h=800&q=85","","","Uluwatu Cliffside Eco-Villas; Rainforest Retreats; Coastal Expeditions"`,
    ]
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers, ...sampleRows].join("\n"))
    const downloadAnchor = document.createElement("a")
    downloadAnchor.setAttribute("href", csvContent)
    downloadAnchor.setAttribute("download", "magazine_upload_template.csv")
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Handle CSV Upload and Automatic AI Web Research Description & Strict Categorization
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const records = parseCSV(text)
      if (records.length === 0) {
        alert("No valid magazine records found in this CSV. Please check that your file includes headers: title,issueNumber,category,price,coverImage,pdfUrl,description,highlights")
        return
      }

      setCsvProcessing(true)
      const newItems: BulkItem[] = []

      for (let i = 0; i < records.length; i++) {
        const rec = records[i]
        const rawTitle = rec.title || rec["magazinetitle"] || ""
        if (!rawTitle.trim()) continue

        let description = rec.description || ""
        let highlights: string[] = []
        if (rec.highlights) {
          highlights = rec.highlights.split(/[;,|]/).map((h) => h.trim()).filter(Boolean)
        }
        let aiCategory: string | undefined = undefined

        setCsvProgress({
          current: i + 1,
          total: records.length,
          currentTitle: rawTitle,
        })

        // Call AI to browse web, research title, generate description AND automatically categorize into 10 allowed categories
        try {
          const aiRes = await fetch("/api/ai/generate-description", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: rawTitle,
              category: rec.category || undefined,
              webSearch: true,
            }),
          })
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            if (!description.trim()) {
              description = aiData.description || ""
            }
            if (highlights.length === 0 && aiData.highlights) {
              highlights = aiData.highlights
            }
            if (aiData.category) {
              aiCategory = aiData.category
            }
          }
        } catch (aiErr) {
          console.warn("AI web generation error for row:", rawTitle, aiErr)
        }

        // Strictly enforce categorization into ONLY the 10 allowed categories:
        // Business, Lifestyle, Design, Fashion, Defense, Travel, Science, Automotive, For Men, Sports
        const finalCategory = normalizeToAllowedCategory(aiCategory || rec.category || rec["categoryname"], rawTitle)

        setCsvProgress((prev) => (prev ? { ...prev, category: finalCategory } : null))

        // Match categoryId from available store categories
        const matchedCat = categories.find(
          (c) =>
            c.name.toLowerCase() === finalCategory.toLowerCase() ||
            c.slug.toLowerCase() === finalCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        )
        const categoryId = matchedCat ? matchedCat.id : `cat_${finalCategory.toLowerCase().replace(/[^a-z0-9]+/g, "")}`

        const priceNum = parseInt(rec.price?.replace(/[^0-9]/g, "") || "45000", 10) || 45000
        const defaultCover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&h=800&q=85"

        newItems.push({
          id: `csv_${Date.now()}_${i}`,
          title: rawTitle,
          issueNumber: rec.issuenumber || rec["issue"] || "Vol. 1 • 2026",
          categoryId,
          price: priceNum,
          coverImage: rec.coverimage || rec["cover"] || defaultCover,
          description,
          highlights,
          pdfUrl: rec.pdfurl || rec["pdf"] || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        })
      }

      if (newItems.length > 0) {
        setBulkItems(newItems)
        setCsvImportMessage(`Successfully imported ${newItems.length} magazine(s)! AI researched the web and categorized them into the 10 authorized categories.`)
        setTimeout(() => setCsvImportMessage(null), 6000)
      }
    } catch (err: any) {
      alert("Error reading CSV file: " + err.message)
    } finally {
      setCsvProcessing(false)
      setCsvProgress(null)
      e.target.value = ""
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

  if (authChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Admin Studio Sign In</h1>
            <p className="text-xs text-slate-500">
              Enter your store administrator credentials to access the magazine control panel.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Administrator Email</label>
              <input
                type="email"
                required
                placeholder="admin@majalahpdf.my.id"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition shadow-lg flex items-center justify-center space-x-2 disabled:bg-slate-400"
            >
              <span>{isLoggingIn ? "Authenticating..." : "Sign In to Admin Studio"}</span>
            </button>
          </form>
        </div>
      </div>
    )
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
            Manage & edit existing publications, bulk upload issues with AI, verify QRIS payment proofs, and chat with customers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>admin@majalahpdf.my.id</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "orders"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Orders & Proofs ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab("magazines")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === "magazines"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Manage & Edit Magazines ({magazines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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
                      <th className="py-3.5 px-4">Ordered Issues</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Payment Proof</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const isExpanded = expandedOrderIds.includes(order.id)
                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-slate-50/50">
                            {/* Order Code */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              <button
                                onClick={() => setSelectedProofOrder(order)}
                                className="hover:text-indigo-600 transition underline flex items-center space-x-1"
                                title="Click to view full order & fulfillment details"
                              >
                                <span>{order.orderCode}</span>
                              </button>
                            </td>

                            {/* Customer Name */}
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              {order.customerName}
                            </td>

                            {/* Customer Gmail */}
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {order.customerEmail}
                            </td>

                            {/* Ordered Issues List + Expand Button */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setSelectedProofOrder(order)}
                                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200"
                                  title="Open Full Magazine List Modal"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>{order.items.length} issue(s) • View List</span>
                                </button>
                                <button
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                  title={isExpanded ? "Collapse inline preview" : "Expand inline preview"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <div
                                className="text-[11px] text-slate-500 mt-1 max-w-[210px] truncate"
                                title={order.items.map((i) => i.title).join(", ")}
                              >
                                {order.items.map((i) => i.title).join(", ")}
                              </div>
                            </td>

                            {/* Total Amount */}
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

                          {/* Expandable sub-row with ordered magazines for fulfillment */}
                          {isExpanded && (
                            <tr className="bg-indigo-50/40 border-b border-indigo-100">
                              <td colSpan={8} className="p-4 pl-8">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                                      <Package className="w-4 h-4 text-indigo-600" />
                                      <span>Publications Ordered by {order.customerName} ({order.items.length} items):</span>
                                    </div>
                                    <button
                                      onClick={() => setSelectedProofOrder(order)}
                                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                                    >
                                      <span>Open Full Fulfillment Modal</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {order.items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-indigo-100 shadow-sm"
                                      >
                                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                          <img
                                            src={item.coverImage}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-bold text-slate-900 text-xs truncate" title={item.title}>
                                            {item.title}
                                          </div>
                                          <div className="text-[10px] text-slate-500">
                                            {item.issueNumber || "Standard Edition"}
                                          </div>
                                          <div className="text-[11px] font-bold text-indigo-700 mt-0.5">
                                            {formatRupiah(item.price)}
                                          </div>
                                        </div>
                                        {item.pdfUrl ? (
                                          <a
                                            href={item.pdfUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center space-x-1 transition flex-shrink-0"
                                            title="Download PDF"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>PDF</span>
                                          </a>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 italic flex-shrink-0">No PDF</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: Manage & Edit Magazines */}
      {/* ===================================================================== */}
      {activeTab === "magazines" && (
        <ManageMagazinesTab
          magazines={magazines}
          categories={categories}
          onRefresh={fetchData}
          onSwitchToUpload={() => setActiveTab("upload")}
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 3: Multi-Add / Bulk Upload with AI Description Generator */}
      {/* ===================================================================== */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Add / Bulk Upload Magazines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add multiple digital issues at once. Import via CSV with automatic AI web research, or add rows manually!
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-300 shadow-sm"
                title="Download formatted CSV spreadsheet template"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download CSV Template</span>
              </button>

              <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>

              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* CSV Import Banner & Drag-Drop Card */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center space-y-3 relative hover:border-indigo-400 transition">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center space-x-1.5">
                <span>Bulk Import via CSV with AI Web Research</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase">AI Browsing</span>
              </h3>
              <p className="text-xs text-slate-600 max-w-xl mx-auto mt-1 leading-relaxed">
                Download the pre-formatted CSV template, fill in your magazine titles, and upload. AI will automatically browse the web, research each magazine title, and generate authentic editorial descriptions & article highlights!
              </p>
            </div>

            {/* 10 Strictly Allowed Categories Display */}
            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                ✨ AI Auto-Categorized Strictly Into These 10 Categories Only:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto">
                {ALLOWED_CATEGORIES.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-100 text-indigo-950 text-[11px] font-semibold shadow-xs"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Download Template (.csv)</span>
              </button>
              <label className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>2. Upload CSV & AI Auto-Fill</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>
            </div>
          </div>

          {/* Feedback Toasts */}
          {csvImportMessage && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{csvImportMessage}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Magazines successfully published to your storefront catalog!</span>
            </div>
          )}

          {/* AI Web Research Progress Modal */}
          {csvProcessing && csvProgress && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-indigo-100 text-center space-y-5 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>AI Web Researching</span>
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Browsing Web & Categorizing...
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Processing magazine {csvProgress.current} of {csvProgress.total}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((csvProgress.current / csvProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-indigo-600 truncate px-2">
                    &ldquo;{csvProgress.currentTitle}&rdquo;
                  </p>
                  {csvProgress.category && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      <span>🏷️ Category:</span>
                      <span className="font-extrabold">{csvProgress.category}</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  AI is searching publication archives to synthesize editorial copy and strictly assign one of the 10 authorized categories.
                </p>
              </div>
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
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Cover Image (3:4 Portrait Ratio)
                      </label>
                      <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {uploadingField?.id === item.id && uploadingField?.field === "coverImage"
                            ? "Uploading to S3..."
                            : "Upload Cover to S3"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={Boolean(uploadingField)}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(item.id, "coverImage", file)
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or uploaded S3 URL"
                      value={item.coverImage}
                      onChange={(e) => updateBulkField(item.id, "coverImage", e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Digital PDF File
                      </label>
                      <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>
                          {uploadingField?.id === item.id && uploadingField?.field === "pdfUrl"
                            ? "Uploading to S3..."
                            : "Upload PDF to S3"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          disabled={Boolean(uploadingField)}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(item.id, "pdfUrl", file)
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="https://yourstorage.com/issue.pdf or uploaded S3 link"
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
      {/* Complete Order Details & Fulfillment Modal */}
      {/* ===================================================================== */}
      {selectedProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProofOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Order Details & Fulfillment Hub
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedProofOrder.status === "verified"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedProofOrder.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedProofOrder.status === "verified"
                      ? "Verified"
                      : selectedProofOrder.status === "rejected"
                      ? "Rejected"
                      : "Pending Verification"}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {selectedProofOrder.orderCode}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Client: <strong className="text-slate-900 font-semibold">{selectedProofOrder.customerName}</strong> • Gmail:{" "}
                  <a
                    href={`mailto:${selectedProofOrder.customerEmail}`}
                    className="text-indigo-600 font-mono hover:underline"
                  >
                    {selectedProofOrder.customerEmail}
                  </a>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Total Order Value</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatRupiah(selectedProofOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Main Content Grid: Left (Magazines List to Deliver), Right (Payment Proof Receipt) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Ordered Magazines */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Client's Purchased Magazines ({selectedProofOrder.items.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Deliver these issues to client
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedProofOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm"
                    >
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-300">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.issueNumber || "Standard Edition"}
                        </div>
                        <div className="text-xs font-bold text-indigo-700">
                          {formatRupiah(item.price)}
                        </div>

                        {/* PDF Download & Link Copy */}
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          {item.pdfUrl ? (
                            <>
                              <a
                                href={item.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </a>
                              <button
                                onClick={() => copyToClipboard(item.pdfUrl!)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition"
                              >
                                {copiedUrl === item.pdfUrl ? (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium">
                              PDF link not configured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email Client Direct Action */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                  <div className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    <span>Quick Client Fulfillment</span>
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    Send the digital download links directly to <strong>{selectedProofOrder.customerEmail}</strong>:
                  </p>
                  <a
                    href={`mailto:${selectedProofOrder.customerEmail}?subject=Your Magazine Order ${selectedProofOrder.orderCode} - Majalah PDF&body=Hello ${encodeURIComponent(
                      selectedProofOrder.customerName
                    )},%0D%0A%0D%0AThank you for your order (${selectedProofOrder.orderCode})!%0D%0A%0D%0AHere are your digital magazine downloads:%0D%0A${encodeURIComponent(
                      selectedProofOrder.items
                        .map((i, idx) => `${idx + 1}. ${i.title}\nDownload: ${i.pdfUrl || "(Contact support)"}`)
                        .join("\n\n")
                    )}%0D%0A%0D%0AEnjoy reading!%0D%0AMajalah PDF Team`}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email All {selectedProofOrder.items.length} PDF Links to Client</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Payment Proof Screenshot */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>QRIS Payment Proof</span>
                  </h4>
                  {selectedProofOrder.paymentProofUrl && (
                    <a
                      href={selectedProofOrder.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center space-x-0.5"
                    >
                      <span>Full Size</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="max-h-[380px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-2 text-center">
                  {selectedProofOrder.paymentProofUrl ? (
                    <img
                      src={selectedProofOrder.paymentProofUrl}
                      alt="Customer Screenshot Receipt"
                      className="mx-auto max-h-[350px] object-contain rounded-xl"
                    />
                  ) : (
                    <div className="py-16 text-slate-400 text-xs">
                      No screenshot receipt attached
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedProofOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Close Window
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedProofOrder.id, "rejected")
                    setSelectedProofOrder(null)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition"
                >
                  Reject Proof
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedProofOrder.id, "verified")
                    setSelectedProofOrder(null)
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow flex items-center space-x-1.5"
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
