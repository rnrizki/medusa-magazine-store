import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    if (!params.path || params.path.length === 0) {
      return new NextResponse("Bad Request: missing image path", { status: 400 })
    }

    const subpath = params.path.join("/")
    const targetUrl = `https://s3api2.skyconnection.id/image/thumbnail/${subpath}`

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "DigitalPitStop-CDN-Edge/1.0",
      },
    })

    if (!upstreamRes.ok) {
      // Fallback: in case thumbnail doesn't exist yet, fetch original image
      const fallbackUrl = `https://s3api2.skyconnection.id/image/${subpath}`
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "DigitalPitStop-CDN-Edge/1.0",
        },
      })

      if (!fallbackRes.ok) {
        return new NextResponse("Thumbnail not found on origin S3", { status: 404 })
      }

      const buffer = await fallbackRes.arrayBuffer()
      const contentType = fallbackRes.headers.get("content-type") || "image/webp"

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "CDN-Cache-Control": "max-age=31536000",
          "Cloudflare-CDN-Cache-Control": "max-age=31536000",
        },
      })
    }

    const buffer = await upstreamRes.arrayBuffer()
    const contentType = upstreamRes.headers.get("content-type") || "image/webp"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "CDN-Cache-Control": "max-age=31536000",
        "Cloudflare-CDN-Cache-Control": "max-age=31536000",
      },
    })
  } catch (error: any) {
    console.error("[CDN-Thumb] Error proxying thumbnail:", error.message)
    return new NextResponse("Error proxying thumbnail: " + error.message, { status: 502 })
  }
}
