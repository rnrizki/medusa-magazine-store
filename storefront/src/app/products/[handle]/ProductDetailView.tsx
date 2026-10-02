"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Product, ProductVariant } from "../../lib/types"
import { formatPrice } from "../../lib/medusa"
import { useCart } from "../../lib/cart-context"
import { ArrowLeft, ShoppingBag, Check, ShieldCheck, Truck, RotateCcw } from "lucide-react"

export default function ProductDetailView({ product }: { product: Product }) {
  const { addItem } = useCart()
  const variants = product.variants || []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    variants[0]
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const activePrice = selectedVariant?.prices?.[0]
  const priceAmount = activePrice ? activePrice.amount : 0
  const currencyCode = activePrice ? activePrice.currency_code : "usd"

  const handleAddToCart = () => {
    if (!selectedVariant) return

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variantTitle: selectedVariant.title,
      thumbnail: product.thumbnail,
      price: priceAmount,
      currencyCode: currencyCode,
      quantity,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/products"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Product Media */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm aspect-square relative">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              No preview available
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div className="space-y-8">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Medusa Commerce
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-base text-slate-500 mt-2">{product.subtitle}</p>
            )}
            <div className="text-3xl font-extrabold text-slate-900 mt-4">
              {formatPrice(priceAmount, currencyCode)}
            </div>
          </div>

          {/* Variant Selector */}
          {variants.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800">
                Select Option / Variant
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`py-2.5 px-3 text-xs font-medium rounded-lg border text-left transition ${
                      selectedVariant?.id === variant.id
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div>{variant.title}</div>
                    {variant.sku && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        SKU: {variant.sku}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition font-bold"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 transition font-bold"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={added || !selectedVariant}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md ${
                  added
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 hover:bg-indigo-600 text-white"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                About this product
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>30-Day Returns</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
