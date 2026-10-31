import { NextRequest, NextResponse } from "next/server"
import { getMagazines } from "@/lib/db"
import { syncMagazinesToMeili, initMeiliSearch } from "@/lib/meilisearch"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const initialized = await initMeiliSearch()
    if (!initialized) {
      return NextResponse.json(
        { success: false, message: "Meilisearch not reachable" },
        { status: 503 }
      )
    }

    const magazines = getMagazines()
    const synced = await syncMagazinesToMeili(magazines)

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${synced} magazines to Meilisearch index.`,
      count: synced,
      total: magazines.length,
      engine: "meilisearch",
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
