import type { Metadata } from "next"
import "./globals.css"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { CartProvider } from "../lib/cart-context"

export const metadata: Metadata = {
  title: "Medusa Store | Modern Ecommerce Stack",
  description:
    "Next.js Storefront powered by Medusa v2 Headless Commerce in Docker",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
