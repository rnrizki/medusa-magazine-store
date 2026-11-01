/**
 * Resolves the optimal low-resolution thumbnail URL for grids, search results, and cards.
 * If the URL originates from RustFS / SkyImage S3 (/image/), it ensures the path points
 * to /image/thumbnail/ (14 KB) rather than the high-resolution original image (800+ KB).
 */
export function getMagazineThumbnail(magazine?: {
  coverImage?: string
  thumbnailUrl?: string
} | null): string {
  if (!magazine) return ""

  const raw = magazine.thumbnailUrl || magazine.coverImage || ""
  if (!raw) return ""

  // If already explicitly a thumbnail
  if (raw.includes("/image/thumbnail/")) {
    return raw
  }

  // If it's a SkyImage / RustFS S3 image path without /thumbnail/
  if (raw.includes("/image/")) {
    return raw.replace("/image/", "/image/thumbnail/")
  }

  // Fallback for third-party images via image proxy /fit
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return `/fit?url=${encodeURIComponent(raw)}&w=300&h=400&format=webp`
  }

  return raw
}
