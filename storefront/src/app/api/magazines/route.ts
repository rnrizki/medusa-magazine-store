import { NextRequest, NextResponse } from "next/server"
import { getMagazines, addMagazines, updateMagazine, deleteMagazine } from "@/lib/db"
import { searchMagazinesMeili, syncMagazinesToMeili, getMeiliClient, INDEX_NAME } from "@/lib/meilisearch"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || undefined
  const search = searchParams.get("search") || undefined

  if (search && search.trim() !== "") {
    // 1. Attempt Meilisearch full-text typo-tolerant search
    try {
      const meiliResult = await searchMagazinesMeili(search, category)
      if (meiliResult && meiliResult.magazines.length > 0) {
        return NextResponse.json(
          {
            magazines: meiliResult.magazines,
            source: "meilisearch",
            totalHits: meiliResult.totalHits,
          },
          {
            headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
          }
        )
      }
    } catch (e: any) {
      console.warn("[API] Meilisearch exception, using fallback:", e.message)
    }

    // 2. Safe local store.json fallback
    const all = getMagazines(category)
    const q = search.toLowerCase()
    const filtered = all.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    )
    return NextResponse.json(
      {
        magazines: filtered,
        source: "fallback",
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    )
  }

  const magazines = getMagazines(category)
  return NextResponse.json(magazines, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
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

    // Asynchronously sync to Meilisearch
    syncMagazinesToMeili(created).catch((e) =>
      console.warn("[API] Background Meilisearch sync warning:", e.message)
    )

    return NextResponse.json(
      {
        success: true,
        count: created.length,
        magazines: created,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "Magazine ID is required" }, { status: 400 })
    }
    const updated = updateMagazine(id, updates)
    if (!updated) {
      return NextResponse.json({ error: "Magazine not found" }, { status: 404 })
    }

    // Asynchronously update in Meilisearch
    syncMagazinesToMeili([updated]).catch((e) =>
      console.warn("[API] Background Meilisearch update warning:", e.message)
    )

    return NextResponse.json(
      { success: true, magazine: updated },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    )
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

    // Asynchronously delete document in Meilisearch
    try {
      getMeiliClient().index(INDEX_NAME).deleteDocument(id).catch(() => {})
    } catch {}

    return NextResponse.json(
      { success: true, message: "Magazine deleted" },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
