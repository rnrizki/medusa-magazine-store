import { Product } from "./types"

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// High quality fallback mock products for instant UI rendering during initial container initialization
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_hoodie",
    title: "Medusa Minimalist Hoodie",
    subtitle: "Premium organic heavyweight cotton blend",
    description:
      "Designed for everyday comfort with ultra-soft fleece backing, reinforced stitching, and a tailored contemporary fit.",
    handle: "medusa-minimalist-hoodie",
    thumbnail:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    options: [
      { title: "Size", values: ["S", "M", "L", "XL"] },
      { title: "Color", values: ["Matte Black", "Heather Gray"] },
    ],
    variants: [
      {
        id: "var_hoodie_1",
        title: "Matte Black / M",
        sku: "HOODIE-BLK-M",
        prices: [{ currency_code: "usd", amount: 7900 }],
        options: { Size: "M", Color: "Matte Black" },
      },
      {
        id: "var_hoodie_2",
        title: "Matte Black / L",
        sku: "HOODIE-BLK-L",
        prices: [{ currency_code: "usd", amount: 7900 }],
        options: { Size: "L", Color: "Matte Black" },
      },
      {
        id: "var_hoodie_3",
        title: "Heather Gray / M",
        sku: "HOODIE-GRY-M",
        prices: [{ currency_code: "usd", amount: 7900 }],
        options: { Size: "M", Color: "Heather Gray" },
      },
    ],
  },
  {
    id: "prod_tshirt",
    title: "Medusa Core Cotton T-Shirt",
    subtitle: "100% combed ring-spun breathable cotton",
    description:
      "The staple tee your wardrobe needs. Soft-washed finish with pre-shrunk fabric to retain its shape wash after wash.",
    handle: "medusa-core-tshirt",
    thumbnail:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    options: [
      { title: "Size", values: ["S", "M", "L"] },
      { title: "Color", values: ["Vintage White", "Jet Black"] },
    ],
    variants: [
      {
        id: "var_tee_1",
        title: "Vintage White / M",
        sku: "TSHIRT-WHT-M",
        prices: [{ currency_code: "usd", amount: 3500 }],
        options: { Size: "M", Color: "Vintage White" },
      },
      {
        id: "var_tee_2",
        title: "Jet Black / L",
        sku: "TSHIRT-BLK-L",
        prices: [{ currency_code: "usd", amount: 3500 }],
        options: { Size: "L", Color: "Jet Black" },
      },
    ],
  },
  {
    id: "prod_mug",
    title: "Ceramic Matte Coffee Mug",
    subtitle: "12oz handcrafted ceramic drinkware",
    description:
      "Ergonomic handle and satin-matte stoneware finish. Microwave and dishwasher safe, crafted for hot espresso or cold brew.",
    handle: "ceramic-matte-coffee-mug",
    thumbnail:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    options: [{ title: "Finish", values: ["Charcoal", "Sand Stone"] }],
    variants: [
      {
        id: "var_mug_1",
        title: "Charcoal",
        sku: "MUG-CHAR",
        prices: [{ currency_code: "usd", amount: 2200 }],
        options: { Finish: "Charcoal" },
      },
    ],
  },
  {
    id: "prod_cap",
    title: "Minimal Canvas Cap",
    subtitle: "Unstructured 6-panel adjustable cotton twill",
    description:
      "Classic curved brim, brass metal buckle strap adjustment, and clean tone-on-tone embroidery.",
    handle: "minimal-canvas-cap",
    thumbnail:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
    options: [{ title: "Color", values: ["Navy", "Olive"] }],
    variants: [
      {
        id: "var_cap_1",
        title: "Navy",
        sku: "CAP-NAVY",
        prices: [{ currency_code: "usd", amount: 2800 }],
        options: { Color: "Navy" },
      },
    ],
  },
]

export async function fetchProducts(): Promise<Product[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }

    const res = await fetch(`${BACKEND_URL}/store/products`, {
      headers,
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.warn(
        `[Medusa API] Request failed with status ${res.status}. Falling back to default catalog.`
      )
      return MOCK_PRODUCTS
    }

    const data = await res.json()
    if (data.products && data.products.length > 0) {
      return data.products
    }
    return MOCK_PRODUCTS
  } catch (error) {
    console.warn(
      `[Medusa API] Backend unreachable at ${BACKEND_URL}. Using fallback demo products.`,
      error
    )
    return MOCK_PRODUCTS
  }
}

export async function fetchProductByHandle(
  handle: string
): Promise<Product | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }

    const res = await fetch(`${BACKEND_URL}/store/products?handle=${handle}`, {
      headers,
      next: { revalidate: 60 },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.products && data.products.length > 0) {
        return data.products[0]
      }
    }
  } catch (error) {
    console.warn(`[Medusa API] Error fetching product ${handle}:`, error)
  }

  // Fallback to local mock catalog
  return MOCK_PRODUCTS.find((p) => p.handle === handle) || null
}

export function formatPrice(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}
