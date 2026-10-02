"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useCart } from "../../lib/cart-context"
import { formatPrice } from "../../lib/medusa"
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalCount } =
    useCart()
  const [checkingOut, setCheckingOut] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  const shippingCost = subtotal > 10000 || subtotal === 0 ? 0 : 900 // $9.00 or Free over $100
  const estimatedTax = Math.round(subtotal * 0.08) // 8% estimated tax
  const total = subtotal + shippingCost + estimatedTax

  const handleCheckout = () => {
    setCheckingOut(true)
    setTimeout(() => {
      setCheckingOut(false)
      setOrderComplete(true)
      clearCart()
    }, 1500)
  }

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Order Confirmed!
        </h1>
        <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
          Thank you for testing the Medusa headless commerce checkout. Your order
          payload has been simulated through the Medusa workflow pipeline.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            onClick={() => setOrderComplete(false)}
            className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
          >
            Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Your shopping cart is empty
          </h2>
          <p className="text-sm text-slate-500">
            Browse our catalog to discover and add products to your cart.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition shadow"
            >
              Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="pb-6 mb-8 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your items ({totalCount} total)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex items-center space-x-4 shadow-sm"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-base truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Variant: {item.variantTitle}
                </p>
                <div className="font-bold text-slate-900 mt-2 text-sm">
                  {formatPrice(item.price, item.currencyCode)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition font-bold text-sm"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition font-bold text-sm"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={clearCart}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition"
            >
              Clear shopping cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-slate-900">
                {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (8%)</span>
              <span className="font-semibold text-slate-900">
                {formatPrice(estimatedTax)}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/20 disabled:opacity-70"
          >
            {checkingOut ? (
              <span>Processing with Medusa...</span>
            ) : (
              <>
                <span>Complete Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-end encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  )
}
