import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { uploadToStorage } from "../../../lib/s3"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name) || ".jpg"
    const safeName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
    const contentType = file.type || "image/jpeg"

    const result = await uploadToStorage(buffer, safeName, contentType)

    return NextResponse.json({
      url: result.url,
      storageType: result.storageType,
      name: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error("Upload handler error:", error)
    return NextResponse.json(
      { error: "Failed to upload file: " + error.message },
      { status: 500 }
    )
  }
}
