import React from "react"
import Link from "next/link"
import { fetchProducts } from "../lib/medusa"
import ProductCard from "../components/ProductCard"
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2,
  Cpu,
  Layers,
  ShoppingBag,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const products = await fetchProducts()

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(45%_50%_at_50%_50%,rgba(99,102,241,0.2)_0%,rgba(15,23,42,1)_100%)] opacity-80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-400/20 px-3 py-1 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Medusa v2 Headless Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            High-Performance Ecommerce,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">
              Containerized.
            </span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Your entire store runs seamlessly inside Docker Compose: Medusa v2
            Core, integrated Admin Dashboard, PostgreSQL 16, Redis 7, and Next.js
            Storefront.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              Explore Products <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <a
              href="http://localhost:9000/app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              Access Medusa Admin <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start space-x-4">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Medusa v2 Workflows
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Modular architecture with atomic, rollback-safe commerce workflows.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start space-x-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Multi-Region & Currency
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configured with North America (USD) and Europe (EUR) regions.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start space-x-4">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                One-Click Docker Stack
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated DB migrations, admin seeding, and network orchestration.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start space-x-4">
            <div className="p-2.5 rounded-lg bg-violet-50 text-violet-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Next.js App Router
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ultra-responsive server-side rendering with Tailwind CSS styling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Catalog Preview</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Live items synced from Medusa Core API and PostgreSQL database.
            </p>
          </div>
          <Link
            href="/products"
            className="mt-4 md:mt-0 text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View all products <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Quickstart Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Admin Management Ready</h3>
            <p className="text-sm text-slate-300 max-w-xl">
              Log into Medusa Admin dashboard at{" "}
              <code className="bg-black/40 px-2 py-0.5 rounded text-indigo-300">
                http://localhost:9000/app
              </code>{" "}
              with email <span className="font-semibold text-white">admin@medusa-store.com</span> and password{" "}
              <span className="font-semibold text-white">supersecret</span> to manage products, pricing, inventory, and orders.
            </p>
          </div>
          <a
            href="http://localhost:9000/app"
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap px-6 py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-100 transition shadow"
          >
            Launch Admin
          </a>
        </div>
      </section>
    </div>
  )
}
