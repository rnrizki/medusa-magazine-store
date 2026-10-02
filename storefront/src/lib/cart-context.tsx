"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { CartItem, Magazine } from "./types"

interface CartContextType {
  items: CartItem[]
  addItem: (magazine: Magazine) => boolean // returns true if added, false if already exists
  removeItem: (magazineId: string) => void
  isInCart: (magazineId: string) => boolean
  clearCart: () => void
  totalCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("magazine_cart")
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load cart", e)
    }
    setIsHydrated(true)
  }, [])

  // Persist cart
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("magazine_cart", JSON.stringify(items))
      } catch (e) {
        console.error("Failed to save cart", e)
      }
    }
  }, [items, isHydrated])

  const isInCart = (magazineId: string) => {
    return items.some((item) => item.magazineId === magazineId)
  }

  const addItem = (magazine: Magazine): boolean => {
    if (isInCart(magazine.id)) {
      return false
    }

    const newItem: CartItem = {
      id: `cart_${magazine.id}`,
      magazineId: magazine.id,
      title: magazine.title,
      issueNumber: magazine.issueNumber,
      coverImage: magazine.coverImage,
      categoryName: magazine.categoryName,
      price: magazine.price,
      quantity: 1, // Digital license is strictly 1
    }

    setItems((prev) => [...prev, newItem])
    return true
  }

  const removeItem = (magazineId: string) => {
    setItems((prev) => prev.filter((item) => item.magazineId !== magazineId))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalCount = items.length
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInCart,
        clearCart,
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
