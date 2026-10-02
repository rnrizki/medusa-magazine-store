import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name) || ".jpg"
    const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
    })
  } catch (error: any) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Failed to upload image: " + error.message }, { status: 500 })
  }
}
