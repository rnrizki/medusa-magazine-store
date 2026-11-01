/**
 * Utility for calculating magazine prices in IDR based on title and publication rules.
 *
 * Rules:
 * 1. jika tahun 2024 (atau <=2024): Rp 12.000
 * 2. tahun 2025: Rp 13.000
 * 3. tahun 2026 (atau >=2026): Rp 15.000
 * 4. yang majalah tanpa tahun: Rp 14.000
 * 5. the economist (all): Rp 18.000
 * 6. Harvard Business Review (all): Rp 21.000
 */
export function calculateMagazinePrice(title: string): number {
  if (!title) return 14000

  // Replace underscores and clean text for regex matching
  const clean = title.replace(/[_]/g, " ").toLowerCase()

  // 6. Harvard Business Review (all) -> Rp 21.000
  if (clean.includes("harvard business review") || /\bhbr\b/.test(clean)) {
    return 21000
  }

  // 5. The Economist (all) -> Rp 18.000
  if (clean.includes("economist")) {
    return 18000
  }

  // Match 4-digit years between 1950 and 2035 not surrounded by other digits
  // e.g. "April 2024", "NovDec2025", "2026"
  const yearMatches = clean.match(/(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)/g)

  if (yearMatches && yearMatches.length > 0) {
    const yr = parseInt(yearMatches[0], 10)
    // 1. jika tahun 2024 (dan edisi sebelumnya): Rp 12.000
    if (yr <= 2024) {
      return 12000
    }
    // 2. tahun 2025: Rp 13.000
    if (yr === 2025) {
      return 13000
    }
    // 3. tahun 2026 (dan edisi setelahnya): Rp 15.000
    if (yr >= 2026) {
      return 15000
    }
  }

  // 4. yang majalah tanpa tahun: Rp 14.000
  return 14000
}
