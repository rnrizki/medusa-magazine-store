import { Magazine } from "./types"

export interface RelatedMagazineItem {
  magazine: Magazine
  matchReason: "similar_title" | "same_category" | "featured"
  matchLabel: string
}

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "issue",
  "vol",
  "volume",
  "edition",
  "no",
  "number",
  "special",
  "release",
  "part",
  "pt",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function getBigrams(str: string): Set<string> {
  const s = str.toLowerCase().replace(/[^a-z0-9]/g, "")
  const bigrams = new Set<string>()
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2))
  }
  return bigrams
}

function diceCoefficient(str1: string, str2: string): number {
  const bg1 = getBigrams(str1)
  const bg2 = getBigrams(str2)
  if (bg1.size === 0 || bg2.size === 0) return 0
  let intersection = 0
  bg1.forEach((b) => {
    if (bg2.has(b)) intersection++
  })
  return (2 * intersection) / (bg1.size + bg2.size)
}

export function computeTitleSimilarity(titleA: string, titleB: string): number {
  const tokensA = tokenize(titleA)
  const tokensB = tokenize(titleB)

  let score = 0
  // Exact or stem token matches
  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB) {
        score += 3
      } else if (tA.length >= 4 && (tA.includes(tB) || tB.includes(tA))) {
        score += 1.8
      }
    }
  }

  // String level dice coefficient
  const dice = diceCoefficient(titleA, titleB)
  score += dice * 2.5

  return score
}

/**
 * Returns 5 related products:
 * - 2 with similar title
 * - 3 from the same category
 * With graceful backfill if catalog has fewer items in a specific category.
 */
export function getRelatedMagazines(
  currentMagazine: Magazine,
  allMagazines: Magazine[]
): RelatedMagazineItem[] {
  // Exclude current magazine
  const candidates = allMagazines.filter((m) => m.id !== currentMagazine.id)
  if (candidates.length === 0) return []

  const selectedIds = new Set<string>()
  const result: RelatedMagazineItem[] = []

  // 1. Pick 2 with highest similar title
  const scoredByTitle = candidates
    .map((m) => ({
      magazine: m,
      score: computeTitleSimilarity(currentMagazine.title, m.title),
    }))
    .sort((a, b) => b.score - a.score)

  const titlePicks: Magazine[] = []
  for (const item of scoredByTitle) {
    if (titlePicks.length >= 2) break
    // We prefer items with some positive similarity score, or top candidates
    titlePicks.push(item.magazine)
    selectedIds.add(item.magazine.id)
  }

  for (const mag of titlePicks) {
    result.push({
      magazine: mag,
      matchReason: "similar_title",
      matchLabel: "Similar Title",
    })
  }

  // 2. Pick 3 from the same category (excluding those already selected)
  const sameCategoryCandidates = candidates.filter(
    (m) => m.categoryId === currentMagazine.categoryId && !selectedIds.has(m.id)
  )

  const categoryPicks = sameCategoryCandidates.slice(0, 3)
  for (const mag of categoryPicks) {
    selectedIds.add(mag.id)
    result.push({
      magazine: mag,
      matchReason: "same_category",
      matchLabel: `From ${currentMagazine.categoryName || "Same Category"}`,
    })
  }

  // 3. Backfill if less than 5 (e.g. if category had fewer than 3 extra items)
  if (result.length < 5) {
    for (const item of scoredByTitle) {
      if (result.length >= 5) break
      if (!selectedIds.has(item.magazine.id)) {
        selectedIds.add(item.magazine.id)
        result.push({
          magazine: item.magazine,
          matchReason:
            item.magazine.categoryId === currentMagazine.categoryId
              ? "same_category"
              : "featured",
          matchLabel:
            item.magazine.categoryId === currentMagazine.categoryId
              ? `From ${currentMagazine.categoryName || "Same Category"}`
              : "Recommended Issue",
        })
      }
    }
  }

  return result.slice(0, 5)
}
