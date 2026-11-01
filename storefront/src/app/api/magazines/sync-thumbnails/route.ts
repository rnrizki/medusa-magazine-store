import { NextRequest, NextResponse } from "next/server"
import { syncThumbnailsAndReconnect, getMagazines } from "../../../../lib/db"
import { syncMagazinesToMeili } from "../../../../lib/meilisearch"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const result = syncThumbnailsAndReconnect()
    try {
      const allMags = getMagazines()
      await syncMagazinesToMeili(allMags)
    } catch (meiliErr: any) {
      console.warn("Meili sync warning in sync-thumbnails:", meiliErr.message)
    }

    return NextResponse.json(
      {
        success: true,
        count: result.updated,
        total: result.total,
        message: `Successfully checked ${result.total} magazines: reconnected and synced thumbnails with RustFS S3.`,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
