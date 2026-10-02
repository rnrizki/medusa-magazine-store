"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { CartItem } from "./types"

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalCount: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medusa_cart")
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("medusa_cart", JSON.stringify(items))
      } catch (e) {
        console.error("Failed to save cart to localStorage", e)
      }
    }
  }, [items, isHydrated])

  const addItem = (newItem: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.variantId === newItem.variantId)
      if (existing) {
        return prev.map((item) =>
          item.variantId === newItem.variantId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      }
      return [
        ...prev,
        {
          ...newItem,
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        },
      ]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
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
