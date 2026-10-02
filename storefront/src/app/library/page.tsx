"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { Order } from "../../lib/types"
import { formatRupiah } from "../../lib/db"
import Link from "next/link"
import {
  BookOpen,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react"

export default function CustomerLibraryPage() {
  const { user, isLoggedIn } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserOrders() {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (err) {
        console.error("Failed to load user orders", err)
      } finally {
        setLoading(false)
      }
    }

    loadUserOrders()
  }, [user?.email])

  if (!isLoggedIn || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Sign In to Access Your Library
        </h2>
        <p className="text-xs text-slate-500">
          Enter your Gmail address in the navigation bar to see your digital
          magazine purchases and download links.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-600 transition"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  // Extract all purchased magazine items from orders
  const allPurchasedItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderCode: order.orderCode,
      orderStatus: order.status,
      orderDate: order.createdAt,
      proofUrl: order.paymentProofUrl,
    }))
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full border border-slate-200"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            {allPurchasedItems.length} Issues Owned
          </span>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-indigo-600 transition"
          >
            Buy More Issues
          </Link>
        </div>
      </div>

      {/* Orders List */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Your Digital Magazine Collection
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading your digital library...
          </div>
        ) : allPurchasedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">
              No magazines in your library yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Any magazines purchased with{" "}
              <strong className="text-slate-700">{user.email}</strong> will
              appear here automatically once QRIS payment proof is submitted.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                <span>Browse Store Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPurchasedItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="flex p-4 space-x-4">
                  {/* 3:4 aspect ratio cover */}
                  <div className="w-20 aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 shadow relative">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    {item.issueNumber && (
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        {item.issueNumber}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Order: {item.orderCode}
                    </p>

                    {/* Status Badge */}
                    <div className="pt-1">
                      {item.orderStatus === "verified" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          <span>Payment Verified</span>
                        </span>
                      ) : item.orderStatus === "rejected" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Payment Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Verification In Progress</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  {item.orderStatus === "verified" ? (
                    <a
                      href={item.pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Digital PDF</span>
                    </a>
                  ) : (
                    <div className="text-center text-[11px] text-slate-500 py-1 flex items-center justify-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Admin is checking your QRIS screenshot</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
