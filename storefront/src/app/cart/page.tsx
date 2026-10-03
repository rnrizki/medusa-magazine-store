"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useCart } from "../../lib/cart-context"
import { useAuth } from "../../lib/auth-context"
import { formatRupiah } from "../../lib/format"
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  UploadCloud,
  Check,
  AlertCircle,
  FileCheck,
  Mail,
  Zap,
} from "lucide-react"

export default function CartAndCheckoutPage() {
  const { items, removeItem, clearCart, subtotal, totalCount } = useCart()
  const { user, loginWithGmail } = useAuth()

  // Checkout State
  const [step, setStep] = useState<"bag" | "qris">("bag")
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [emailError, setEmailError] = useState("")

  // Payment Proof Screenshot State
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  // Validate Gmail
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      return
    }
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailError("Please enter a valid email address")
      return
    }
    setEmailError("")
    // Auto-login to AuthContext with their Gmail
    loginWithGmail(cleanEmail, name)
    setStep("qris")
  }

  // Handle Screenshot Proof Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit Order with Payment Proof
  const handleSubmitOrder = async () => {
    if (!proofPreview && !proofFile) {
      alert("Please upload your payment screenshot/screengrab before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      let finalProofUrl = proofPreview || ""

      // Upload file to server upload API if available
      if (proofFile) {
        try {
          const formData = new FormData()
          formData.append("file", proofFile)
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            if (uploadData.url) {
              finalProofUrl = uploadData.url
            }
          }
        } catch (uploadErr) {
          console.warn("Server upload fallback to base64 preview", uploadErr)
        }
      }

      // Submit Order to Database
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          items: items.map((i) => ({
            id: i.magazineId,
            title: i.title,
            issueNumber: i.issueNumber,
            coverImage: i.coverImage,
            price: i.price,
          })),
          paymentProofUrl: finalProofUrl,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to place order")
      }

      const orderData = await res.json()
      setOrderResult(orderData)
      clearCart()
    } catch (err: any) {
      alert("Order submission error: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 3: Order Completed & Payment Under Review
  if (orderResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Payment Proof Received
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Order Submitted Successfully!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Your payment receipt has been sent to the store admin for verification.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Order Reference:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {orderResult.orderCode}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Customer Gmail:</span>
            <span className="font-semibold text-slate-900">
              {orderResult.customerEmail}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500">Total Paid (QRIS):</span>
            <span className="font-bold text-slate-900 text-sm">
              {formatRupiah(orderResult.totalAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Pending Admin Verification
            </span>
          </div>

          {orderResult.paymentProofUrl && (
            <div className="pt-2">
              <span className="text-xs text-slate-500 block mb-1">
                Uploaded Payment Proof:
              </span>
              <img
                src={orderResult.paymentProofUrl}
                alt="Payment proof screenshot"
                className="w-28 h-28 object-cover rounded-lg border border-slate-200"
              />
            </div>
          )}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/library"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow flex items-center justify-center space-x-2"
          >
            <span>Check My Library</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Browse More Issues
          </Link>
        </div>
      </div>
    )
  }

  // Empty Bag
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Your digital bag is empty
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Explore our collection of digital magazine editions and add your favorite issue.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-indigo-600 transition shadow"
          >
            Browse Digital Issues <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 mb-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {step === "bag" ? "Digital Magazine Bag" : "Scan QRIS & Upload Receipt"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === "bag"
              ? `Review your digital magazine selection (${totalCount} issue${totalCount > 1 ? "s" : ""})`
              : "Complete payment via QRIS, then upload your screengrab receipt."}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === "bag"
                ? "bg-slate-900 text-white"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            1. Your Bag & Gmail
          </span>
          <span className="text-slate-300">→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === "qris"
                ? "bg-indigo-600 text-white shadow"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            2. QRIS Payment & Proof
          </span>
        </div>
      </div>

      {/* STEP 1: Bag & Minimalist Gmail Info */}
      {step === "bag" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Magazine List (3:4 Covers) */}
          <div className="lg:col-span-7 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-4 shadow-sm"
              >
                {/* 3:4 Aspect Ratio Cover Thumbnail */}
                <div className="w-16 aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 shadow relative">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {item.categoryName && (
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {item.categoryName}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      Digital PDF
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatRupiah(item.price)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.magazineId)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  title="Remove issue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Minimalist Checkout Form (ONLY Name & Gmail) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Customer Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Only your Name and Gmail account are required. Digital issues will be linked to this Gmail.
              </p>
            </div>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Rizki"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gmail Account *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError("")
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-rose-500 ring-rose-500"
                      : "border-slate-300 focus:ring-indigo-500"
                  }`}
                />
                {emailError && (
                  <p className="text-[11px] text-rose-500 mt-1">{emailError}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  We send order receipts and digital access keys to this Gmail.
                </p>
              </div>

              {/* Order Cost Breakdown */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalCount} digital issue{totalCount > 1 ? "s" : ""})</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Shipping (Digital Delivery)</span>
                  <span>FREE (Rp 0)</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-base text-indigo-600">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg active:scale-[0.99]"
              >
                <span>Continue to QRIS Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero Address Required • Instant Gmail Authorization</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: QRIS Payment Display & Screenshot Proof Upload */}
      {step === "qris" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Real QRIS Barcode & Payment Instructions */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Official QRIS National Standard
              </span>
              <h2 className="text-lg font-black text-slate-900">
                DIGITALPITSTOP - SOFTWARE
              </h2>
              <p className="text-xs text-slate-500">
                NMID: ID1026568992402 • A01
              </p>
            </div>

            {/* QRIS Image Provided by the User */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-w-[320px] mx-auto shadow-inner text-center">
              <img
                src="/qris.jpg"
                alt="QRIS Payment Code - DIGITALPITSTOP SOFTWARE"
                className="w-full rounded-xl object-contain shadow-sm"
              />
              <p className="text-[11px] text-slate-500 font-medium mt-2">
                SATU QRIS UNTUK SEMUA (BCA, Mandiri, ShopeePay, GoPay, OVO, Dana)
              </p>
            </div>

            {/* Exact Transfer Amount */}
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 text-center space-y-1">
              <span className="text-xs text-indigo-700 font-medium">
                Total Payment Amount:
              </span>
              <div className="text-2xl font-black text-indigo-900 tracking-tight">
                {formatRupiah(subtotal)}
              </div>
              <p className="text-[11px] text-indigo-600 font-medium">
                Please transfer the exact amount above.
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">How to pay:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Open your mobile banking or e-wallet app (ShopeePay, BCA, GoPay, OVO, Dana).</li>
                <li>Tap <strong>Scan QRIS</strong> and point camera to code above.</li>
                <li>Verify merchant: <strong>DIGITALPITSTOP - SOFTWARE</strong>.</li>
                <li>Enter exact amount: <strong>{formatRupiah(subtotal)}</strong>.</li>
                <li>Confirm payment & <strong>screenshot / screen grab</strong> your receipt.</li>
              </ol>
            </div>
          </div>

          {/* Right: Payment Proof Upload */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Upload Payment Screenshot
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload the screengrab / screenshot of your successful QRIS transfer.
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition bg-slate-50 relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {proofPreview ? (
                <div className="space-y-3">
                  <div className="relative max-w-[240px] mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    <img
                      src={proofPreview}
                      alt="Proof Preview"
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 flex items-center justify-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Proof image selected. Click to replace.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Tap to select or drop screenshot here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, JPEG or WEBP (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Customer Summary & Submit */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-600 border border-slate-200">
              <div className="flex justify-between">
                <span>Account Name:</span>
                <span className="font-bold text-slate-900">{name}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Gmail:</span>
                <span className="font-bold text-slate-900">{email}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSubmitOrder}
                disabled={!proofPreview || isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <span>Submitting Order & Verifying...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirm Payment & Submit Proof</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setStep("bag")}
                disabled={isSubmitting}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
              >
                ← Back to bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
