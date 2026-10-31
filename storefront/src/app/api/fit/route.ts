import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const RUST_IMAGE_OPTIMIZER_URL =
  process.env.IMAGE_OPTIMIZER_URL || "http://image-optimizer:3001"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing required parameter 'url'" }, { status: 400 })
  }

  try {
    const upstreamUrl = `${RUST_IMAGE_OPTIMIZER_URL}/fit?${searchParams.toString()}`
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/webp,image/*,*/*",
      },
      next: { revalidate: 86400 }, // Cache in Next.js ISR cache
    })

    if (!upstreamRes.ok) {
      // Fallback: redirect directly to source image if optimizer fails
      return NextResponse.redirect(imageUrl, 302)
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/webp"
    const imageBytes = await upstreamRes.arrayBuffer()

    return new NextResponse(imageBytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Powered-By": "Rust-Axum-Image-Optimizer",
      },
    })
  } catch (error: any) {
    console.warn("[Image Optimizer Proxy] Falling back to direct URL:", error.message)
    return NextResponse.redirect(imageUrl, 302)
  }
}
