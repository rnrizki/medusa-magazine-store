export interface ProductVariant {
  id: string
  title: string
  sku?: string
  prices: {
    currency_code: string
    amount: number
  }[]
  options?: Record<string, string>
}

export interface ProductOption {
  id?: string
  title: string
  values: string[]
}

export interface Product {
  id: string
  title: string
  subtitle?: string
  description?: string
  handle: string
  thumbnail?: string
  options?: ProductOption[]
  variants?: ProductVariant[]
  categories?: { id: string; name: string }[]
}

export interface CartItem {
  id: string
  productId: string
  variantId: string
  title: string
  variantTitle: string
  thumbnail?: string
  price: number
  currencyCode: string
  quantity: number
}
