/**
 * Resolves the optimal low-resolution thumbnail URL for grids, search results, and cards.
 * Routes images through Cloudflare Edge Cache (/cdn-thumb/...) which fetches the 14 KB
 * thumbnail from RustFS S3 on cache miss and serves it from Cloudflare Edge worldwide.
 */
export function getMagazineThumbnail(magazine?: {
  coverImage?: string
  thumbnailUrl?: string
} | null): string {
  if (!magazine) return ""

  const raw = magazine.thumbnailUrl || magazine.coverImage || ""
  if (!raw) return ""

  // Already a CDN thumbnail path
  if (raw.startsWith("/cdn-thumb/")) {
    return raw
  }

  // If pointing to S3 thumbnail
  if (raw.includes("/image/thumbnail/")) {
    const subpath = raw.split("/image/thumbnail/")[1]
    if (subpath) return `/cdn-thumb/${subpath}`
  }

  // If pointing to S3 image without thumbnail folder
  if (raw.includes("/image/")) {
    const subpath = raw.split("/image/")[1]
    if (subpath) return `/cdn-thumb/${subpath}`
  }

  // Fallback for third-party images via image proxy /fit
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return `/fit?url=${encodeURIComponent(raw)}&w=300&h=400&format=webp`
  }

  return raw
}
