export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  created_at?: string
}

export interface Magazine {
  id: string
  title: string
  issueNumber?: string
  categoryId: string
  categoryName?: string
  price: number // in IDR (e.g., 45000)
  coverImage: string // 3:4 ratio cover image
  description: string
  highlights?: string[]
  pdfUrl?: string // digital file link
  created_at: string
}

export interface CartItem {
  id: string
  magazineId: string
  title: string
  issueNumber?: string
  coverImage: string
  categoryName?: string
  price: number
  // Notice: Digital product has fixed quantity 1
  quantity: 1
}

export interface Order {
  id: string
  orderCode: string
  customerName: string
  customerEmail: string // Gmail account
  items: {
    magazineId: string
    title: string
    issueNumber?: string
    coverImage: string
    price: number
    pdfUrl?: string
  }[]
  totalAmount: number
  status: "pending_verification" | "verified" | "rejected"
  paymentProofUrl?: string // Screengrab image (base64 or URL)
  paymentProofUploadedAt?: string
  adminNotes?: string
  createdAt: string
}

export interface StoreSettings {
  merchantName: string
  nmid: string
  qrisImageUrl: string
  supportEmail: string
  currency: string
}

export interface EmbeddedProduct {
  magazineId: string
  title: string
  issueNumber?: string
  coverImage: string
  price: number
}

export interface ChatMessage {
  id: string
  sender: "customer" | "admin"
  senderName: string
  text: string
  imageUrl?: string
  productEmbed?: EmbeddedProduct
  timestamp: string
  read: boolean
}

export interface Conversation {
  id: string
  customerEmail: string
  customerName: string
  messages: ChatMessage[]
  updatedAt: string
}
