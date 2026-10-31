import { NextRequest, NextResponse } from "next/server"
import { getMagazines } from "@/lib/db"
import { syncMagazinesToParadeDb, initParadeDb } from "@/lib/paradedb"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const initialized = await initParadeDb()
    if (!initialized) {
      return NextResponse.json(
        { success: false, message: "ParadeDB not available or unreachable" },
        { status: 503 }
      )
    }

    const magazines = getMagazines()
    const synced = await syncMagazinesToParadeDb(magazines)

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${synced} magazines to ParadeDB BM25 index.`,
      count: synced,
      total: magazines.length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
