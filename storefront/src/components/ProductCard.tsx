"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Product } from "../lib/types"
import { formatPrice } from "../lib/medusa"
import { useCart } from "../lib/cart-context"
import { Plus, Check } from "lucide-react"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // Get lowest price from variants
  const defaultVariant = product.variants?.[0]
  const defaultPrice = defaultVariant?.prices?.[0]
  const priceAmount = defaultPrice ? defaultPrice.amount : 0
  const currencyCode = defaultPrice ? defaultPrice.currency_code : "usd"

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!defaultVariant) return

    addItem({
      productId: product.id,
      variantId: defaultVariant.id,
      title: product.title,
      variantTitle: defaultVariant.title,
      thumbnail: product.thumbnail,
      price: priceAmount,
      currencyCode: currencyCode,
      quantity: 1,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              No Image
            </div>
          )}
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {formatPrice(priceAmount, currencyCode)}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.title}
          </h3>
          {product.subtitle && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {product.subtitle}
            </p>
          )}
        </div>
      </Link>

      <div className="p-4 pt-0">
        <button
          onClick={handleQuickAdd}
          disabled={added}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-slate-900 text-white hover:bg-indigo-600"
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
