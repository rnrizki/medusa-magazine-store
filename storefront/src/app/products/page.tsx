import React from "react"
import { fetchProducts } from "../../lib/medusa"
import ProductCard from "../../components/ProductCard"
import { Package, SlidersHorizontal } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const products = await fetchProducts()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Store Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            All Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore {products.length} products available in store.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-sm text-slate-600">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>Currencies: USD, EUR</span>
          </span>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">
            No products found
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Products will appear once Medusa completes initial seeding or when
            you add items via the admin panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
