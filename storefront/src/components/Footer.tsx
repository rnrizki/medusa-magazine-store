import React from "react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-lg mb-3">
              <span className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-xs">
                M2
              </span>
              <span>Medusa Store</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full-featured headless ecommerce built with Medusa v2, Next.js 14,
              PostgreSQL, and Redis running in Docker containers.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">
              Storefront
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">
              Management
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="http://localhost:9000/app"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  Medusa Admin Dashboard
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:9000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  Backend Health Endpoint
                </a>
              </li>
              <li>
                <a
                  href="https://docs.medusajs.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition"
                >
                  Medusa v2 Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">
              Architecture
            </h4>
            <div className="text-xs space-y-1.5 text-slate-400">
              <p>• Backend: Medusa v2 (Port 9000)</p>
              <p>• Storefront: Next.js 14 (Port 8000)</p>
              <p>• Database: PostgreSQL 16 (Port 5432)</p>
              <p>• Cache: Redis 7 (Port 6379)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Medusa Ecommerce Store. Containerized with Docker.</p>
          <p className="mt-4 sm:mt-0">Built for scale, agility, and performance.</p>
        </div>
      </div>
    </footer>
  )
}
