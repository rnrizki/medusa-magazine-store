import { NextRequest, NextResponse } from "next/server"
import { repriceAllMagazines, getMagazines } from "@/lib/db"
import { syncMagazinesToMeili, initMeiliSearch } from "@/lib/meilisearch"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const result = repriceAllMagazines()

    // Sync updated prices to Meilisearch
    let meiliCount = 0
    const initialized = await initMeiliSearch()
    if (initialized) {
      const allMags = getMagazines()
      meiliCount = await syncMagazinesToMeili(allMags)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully repriced ${result.updated} of ${result.total} magazines and synced ${meiliCount} to Meilisearch.`,
      result,
      meiliCount,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
