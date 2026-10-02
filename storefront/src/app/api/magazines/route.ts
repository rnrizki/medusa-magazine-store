import { NextRequest, NextResponse } from "next/server"
import { getMagazines, addMagazines, deleteMagazine } from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || undefined
  const magazines = getMagazines(category)
  return NextResponse.json(magazines)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Support both an array of magazines or a single magazine object
    const items = Array.isArray(body.magazines)
      ? body.magazines
      : Array.isArray(body)
      ? body
      : [body]

    if (items.length === 0) {
      return NextResponse.json({ error: "No magazine data provided" }, { status: 400 })
    }

    // Validate essential fields
    for (const item of items) {
      if (!item.title || !item.categoryId) {
        return NextResponse.json(
          { error: "Each magazine must include at least a title and categoryId" },
          { status: 400 }
        )
      }
      if (!item.coverImage) {
        item.coverImage =
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&h=800&q=85"
      }
      if (!item.price) {
        item.price = 45000
      }
    }

    const created = addMagazines(items)
    return NextResponse.json({
      success: true,
      count: created.length,
      magazines: created,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Magazine ID is required" }, { status: 400 })
    }
    const success = deleteMagazine(id)
    if (!success) {
      return NextResponse.json({ error: "Magazine not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: "Magazine deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
