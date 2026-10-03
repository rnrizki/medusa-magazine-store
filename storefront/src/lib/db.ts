import fs from "fs"
import path from "path"
import {
  Category,
  Magazine,
  Order,
  StoreSettings,
  Conversation,
  ChatMessage,
  EmbeddedProduct,
} from "./types"

const DATA_FILE = path.join(process.cwd(), "data", "store.json")

interface StoreData {
  categories: Category[]
  magazines: Magazine[]
  orders: Order[]
  settings: StoreSettings
  conversations?: Conversation[]
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat_tech",
    name: "Technology & AI",
    slug: "technology-ai",
    description: "Cutting-edge artificial intelligence, quantum computing, and software innovation.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_auto",
    name: "Automotive & Supercars",
    slug: "automotive-supercars",
    description: "High-performance hypercars, motorsport journalism, and electric vehicle engineering.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_fashion",
    name: "Fashion & Style",
    slug: "fashion-style",
    description: "Contemporary runway couture, street luxury, and avant-garde aesthetic directions.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_gaming",
    name: "Gaming & Esports",
    slug: "gaming-esports",
    description: "In-depth game development analysis, competitive esports leagues, and gaming culture.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_design",
    name: "Architecture & Design",
    slug: "architecture-design",
    description: "Sustainable modern living, architectural masterpieces, and industrial design.",
    created_at: new Date().toISOString(),
  },
]

const DEFAULT_MAGAZINES: Magazine[] = [
  {
    id: "mag_tech_1",
    title: "QUANTUM AI - Issue #42: The Synthetic Mind",
    issueNumber: "Vol. 42 • Oct 2026",
    categoryId: "cat_tech",
    categoryName: "Technology & AI",
    price: 49000, // Rp 49.000
    // High quality 3:4 portrait magazine cover image
    coverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=800&q=85",
    description:
      "An exclusive deep-dive into autonomous neural architectures, post-silicon computation, and the moral landscape of sentient AI. Features an interview with leading frontier lab founders and a 30-page editorial retrospective.",
    highlights: [
      "Exclusive: Inside DeepMind's Next Frontier Reasoning Engine",
      "Quantum Supremacy in Commercial Logistics",
      "The Blueprint for Autonomous Robotics Operating Systems",
    ],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: new Date().toISOString(),
  },
  {
    id: "mag_auto_1",
    title: "APEX HORSEPOWER - Hypercars of 2027",
    issueNumber: "Edition #88 • Special Release",
    categoryId: "cat_auto",
    categoryName: "Automotive & Supercars",
    price: 55000, // Rp 55.000
    coverImage:
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=600&h=800&q=85",
    description:
      "Witness the clash of 2000-horsepower hybrid titans on the Nürburgring Nordschleife. Complete with dyno telemetry, track aerofoil analysis, and high-resolution cockpit photography.",
    highlights: [
      "Track Test: Rimac Nevera R vs Koenigsegg Jesko Attack",
      "Aerodynamics of Active Ground Effect Spoilers",
      "The Final V12 Symphony: Pure Combustion Collectibles",
    ],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: new Date().toISOString(),
  },
  {
    id: "mag_fashion_1",
    title: "NEO-VOGUE - Minimalism in Tokyo & Paris",
    issueNumber: "Fall/Winter Edition",
    categoryId: "cat_fashion",
    categoryName: "Fashion & Style",
    price: 45000, // Rp 45.000
    coverImage:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&h=800&q=85",
    description:
      "Exploring architectural silhouettes, bespoke Japanese denim tailoring, and the renaissance of organic textiles. Curated by top Parisian art directors with studio lookbooks.",
    highlights: [
      "Tokyo Streetwear Meets French Haute Couture",
      "Sustainable Cashmere & Smart Fabric Innovations",
      "Photographic Gallery: 40 Pages of Midnight Paris",
    ],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: new Date().toISOString(),
  },
  {
    id: "mag_design_1",
    title: "ARCHITECTURA - Tropical Brutalism",
    issueNumber: "Issue #19 • Global Design",
    categoryId: "cat_design",
    categoryName: "Architecture & Design",
    price: 50000, // Rp 50.000
    coverImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&h=800&q=85",
    description:
      "Raw exposed concrete seamlessly intertwined with lush rainforest canopies in Bali, São Paulo, and Singapore. An exploration of passive ventilation, natural daylighting, and monolithic structural serenity.",
    highlights: [
      "Villa Monolith: The Cliffside Sanctuary of Uluwatu",
      "Thermal Mass Cooling Without Air Conditioning",
      "Material Study: Board-Marked Concrete & Reclaimed Teak",
    ],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: new Date().toISOString(),
  },
  {
    id: "mag_gaming_1",
    title: "PIXEL CHRONICLE - The Unreal Engine 6 Era",
    issueNumber: "Vol. 63 • Next-Gen Dev",
    categoryId: "cat_gaming",
    categoryName: "Gaming & Esports",
    price: 40000, // Rp 40.000
    coverImage:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&h=800&q=85",
    description:
      "Inside the next generation of photorealistic game worlds: real-time ray-traced audio, procedural narrative generation, and the evolution of open-world worldbuilding.",
    highlights: [
      "Breaking Down Nanite 2.0 & Lumen Global Illumination",
      "Interview with Legendary RPG Scenario Designers",
      "Retro Spotlight: The 30-Year Legacy of Doom & Quake",
    ],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    created_at: new Date().toISOString(),
  },
]

const DEFAULT_SETTINGS: StoreSettings = {
  merchantName: "DIGITALPITSTOP - SOFTWARE",
  nmid: "ID1026568992402",
  qrisImageUrl: "/qris.jpg",
  supportEmail: "support@digitalpitstop.com",
  currency: "IDR",
}

function loadData(): StoreData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreData = {
        categories: DEFAULT_CATEGORIES,
        magazines: DEFAULT_MAGAZINES,
        orders: [],
        settings: DEFAULT_SETTINGS,
        conversations: [],
      }
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8")
      return initial
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (!parsed.conversations) {
      parsed.conversations = []
    }
    return parsed
  } catch (error) {
    console.error("Error reading store.json, returning fallback", error)
    return {
      categories: DEFAULT_CATEGORIES,
      magazines: DEFAULT_MAGAZINES,
      orders: [],
      settings: DEFAULT_SETTINGS,
      conversations: [],
    }
  }
}

function saveData(data: StoreData) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing to store.json", error)
  }
}

// ============================================================================
// Categories API
// ============================================================================
export function getCategories(): Category[] {
  const data = loadData()
  return data.categories || []
}

export function addCategory(name: string, description?: string): Category {
  const data = loadData()
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const newCat: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    slug,
    description: description || "",
    created_at: new Date().toISOString(),
  }
  data.categories.push(newCat)
  saveData(data)
  return newCat
}

export function deleteCategory(id: string): boolean {
  const data = loadData()
  const beforeCount = data.categories.length
  data.categories = data.categories.filter((c) => c.id !== id)
  if (data.categories.length !== beforeCount) {
    saveData(data)
    return true
  }
  return false
}

// ============================================================================
// Magazines API (Single + Multi Add / Bulk Upload)
// ============================================================================
export function getMagazines(categoryId?: string): Magazine[] {
  const data = loadData()
  if (categoryId && categoryId !== "all") {
    return data.magazines.filter((m) => m.categoryId === categoryId)
  }
  return data.magazines || []
}

export function getMagazineById(id: string): Magazine | null {
  const data = loadData()
  return data.magazines.find((m) => m.id === id) || null
}

export function addMagazines(magazinesList: Omit<Magazine, "id" | "created_at">[]): Magazine[] {
  const data = loadData()
  const created: Magazine[] = []

  for (const item of magazinesList) {
    const category = data.categories.find((c) => c.id === item.categoryId)
    const newMag: Magazine = {
      ...item,
      id: `mag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      categoryName: category ? category.name : item.categoryName || "General",
      created_at: new Date().toISOString(),
    }
    data.magazines.unshift(newMag)
    created.push(newMag)
  }

  saveData(data)
  return created
}

export function updateMagazine(id: string, updates: Partial<Magazine>): Magazine | null {
  const data = loadData()
  const index = data.magazines.findIndex((m) => m.id === id)
  if (index === -1) return null

  let categoryName = data.magazines[index].categoryName
  if (updates.categoryId && updates.categoryId !== data.magazines[index].categoryId) {
    const cat = data.categories.find((c) => c.id === updates.categoryId)
    if (cat) categoryName = cat.name
  }

  const updated: Magazine = {
    ...data.magazines[index],
    ...updates,
    categoryName: updates.categoryName || categoryName,
  }

  data.magazines[index] = updated
  saveData(data)
  return updated
}

export function deleteMagazine(id: string): boolean {
  const data = loadData()
  const beforeCount = data.magazines.length
  data.magazines = data.magazines.filter((m) => m.id !== id)
  if (data.magazines.length !== beforeCount) {
    saveData(data)
    return true
  }
  return false
}

// ============================================================================
// Orders & Payment Verification API
// ============================================================================
export function getOrders(): Order[] {
  const data = loadData()
  return (data.orders || [])
    .map((order) => ({
      ...order,
      items: (order.items || []).map((item) => {
        if (!item.pdfUrl) {
          const mag = data.magazines.find(
            (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          )
          if (mag?.pdfUrl) {
            return { ...item, pdfUrl: mag.pdfUrl }
          }
        }
        return item
      }),
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function getOrderById(id: string): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === id || o.orderCode === id) || null
  if (!order) return null
  return {
    ...order,
    items: (order.items || []).map((item) => {
      if (!item.pdfUrl) {
        const mag = data.magazines.find(
          (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
        )
        if (mag?.pdfUrl) {
          return { ...item, pdfUrl: mag.pdfUrl }
        }
      }
      return item
    }),
  }
}

export function getOrdersByCustomerEmail(email: string): Order[] {
  const data = loadData()
  const cleanEmail = email.trim().toLowerCase()
  return (data.orders || [])
    .filter((o) => o.customerEmail.trim().toLowerCase() === cleanEmail)
    .map((order) => ({
      ...order,
      items: (order.items || []).map((item) => {
        if (!item.pdfUrl) {
          const mag = data.magazines.find(
            (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          )
          if (mag?.pdfUrl) {
            return { ...item, pdfUrl: mag.pdfUrl }
          }
        }
        return item
      }),
    }))
}

export function createOrder(
  customerName: string,
  customerEmail: string,
  items: Magazine[],
  paymentProofUrl?: string
): Order {
  const data = loadData()
  const randomSuffix = Math.floor(10000 + Math.random() * 90000)
  const orderCode = `ORD-MAG-${randomSuffix}`

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

  const newOrder: Order = {
    id: `order_${Date.now()}`,
    orderCode,
    customerName,
    customerEmail: customerEmail.trim().toLowerCase(),
    items: items.map((m) => {
      const magFromDb = data.magazines.find(
        (x) => x.id === (m as any).magazineId || x.id === m.id || x.title.trim().toLowerCase() === m.title.trim().toLowerCase()
      )
      return {
        magazineId: m.id || (m as any).magazineId,
        title: m.title,
        issueNumber: m.issueNumber || magFromDb?.issueNumber,
        coverImage: m.coverImage || magFromDb?.coverImage || "",
        price: m.price || magFromDb?.price || 0,
        pdfUrl: (m as any).pdfUrl || magFromDb?.pdfUrl || "",
      }
    }),
    totalAmount,
    status: paymentProofUrl ? "pending_verification" : "pending_verification",
    paymentProofUrl,
    paymentProofUploadedAt: paymentProofUrl ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  }

  data.orders.unshift(newOrder)
  saveData(data)
  return newOrder
}

export function attachPaymentProof(orderId: string, proofUrl: string): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === orderId || o.orderCode === orderId)
  if (!order) return null

  order.paymentProofUrl = proofUrl
  order.paymentProofUploadedAt = new Date().toISOString()
  order.status = "pending_verification"
  saveData(data)
  return order
}

export function updateOrderStatus(
  orderId: string,
  status: "verified" | "rejected" | "pending_verification",
  adminNotes?: string
): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === orderId || o.orderCode === orderId)
  if (!order) return null

  order.status = status
  if (adminNotes !== undefined) {
    order.adminNotes = adminNotes
  }
  saveData(data)
  return order
}

// ============================================================================
// Store Settings
// ============================================================================
export function getSettings(): StoreSettings {
  const data = loadData()
  return data.settings || DEFAULT_SETTINGS
}

export function updateSettings(settings: Partial<StoreSettings>): StoreSettings {
  const data = loadData()
  data.settings = { ...data.settings, ...settings }
  saveData(data)
  return data.settings
}

export { formatRupiah } from "./format"


// ============================================================================
// Live Customer Chat API
// ============================================================================
export function getConversations(): Conversation[] {
  const data = loadData()
  return (data.conversations || []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getConversationByEmail(email: string): Conversation | null {
  const data = loadData()
  const cleanEmail = email.trim().toLowerCase()
  return (
    (data.conversations || []).find(
      (c) => c.customerEmail.toLowerCase() === cleanEmail
    ) || null
  )
}

export function sendChatMessage(params: {
  customerEmail: string
  customerName?: string
  sender: "customer" | "admin"
  senderName?: string
  text?: string
  imageUrl?: string
  productEmbed?: EmbeddedProduct
}): { conversation: Conversation; message: ChatMessage } {
  const data = loadData()
  if (!data.conversations) {
    data.conversations = []
  }

  const cleanEmail = params.customerEmail.trim().toLowerCase()
  let conv = data.conversations.find(
    (c) => c.customerEmail.toLowerCase() === cleanEmail
  )

  const now = new Date().toISOString()

  if (!conv) {
    conv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerEmail: cleanEmail,
      customerName: params.customerName || cleanEmail.split("@")[0],
      messages: [],
      updatedAt: now,
    }
    data.conversations.unshift(conv)
  }

  if (params.customerName && params.sender === "customer") {
    conv.customerName = params.customerName
  }

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: params.sender,
    senderName:
      params.senderName ||
      (params.sender === "admin" ? "Store Owner (DigitalPitstop)" : conv.customerName),
    text: params.text || "",
    imageUrl: params.imageUrl,
    productEmbed: params.productEmbed,
    timestamp: now,
    read: false,
  }

  conv.messages.push(newMessage)
  conv.updatedAt = now

  saveData(data)
  return { conversation: conv, message: newMessage }
}

export function markChatAsRead(customerEmail: string, reader: "customer" | "admin"): boolean {
  const data = loadData()
  const cleanEmail = customerEmail.trim().toLowerCase()
  const conv = (data.conversations || []).find(
    (c) => c.customerEmail.toLowerCase() === cleanEmail
  )
  if (!conv) return false

  // If reader is customer, mark all admin messages as read
  // If reader is admin, mark all customer messages as read
  const targetSender = reader === "customer" ? "admin" : "customer"
  let changed = false

  for (const msg of conv.messages) {
    if (msg.sender === targetSender && !msg.read) {
      msg.read = true
      changed = true
    }
  }

  if (changed) {
    saveData(data)
  }
  return true
}

