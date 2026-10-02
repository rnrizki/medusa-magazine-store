import type { Metadata } from "next"
import "./globals.css"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import ChatWidget from "../components/ChatWidget"
import { CartProvider } from "../lib/cart-context"
import { AuthProvider } from "../lib/auth-context"

export const metadata: Metadata = {
  title: "DIGITALPITSTOP Magazines | Premium Digital Editions",
  description:
    "Explore high-resolution digital magazines with instant delivery to your Gmail and seamless QRIS payment.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
