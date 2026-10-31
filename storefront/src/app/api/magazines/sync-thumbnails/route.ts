import { NextRequest, NextResponse } from "next/server"
import { syncThumbnailsAndReconnect } from "../../../../lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const result = syncThumbnailsAndReconnect()
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
