const MONTH_MAP: Record<string, number> = {
  january: 0,
  jan: 0,
  januari: 0,
  february: 1,
  feb: 1,
  februari: 1,
  march: 2,
  mar: 2,
  maret: 2,
  april: 3,
  apr: 3,
  may: 4,
  mei: 4,
  june: 5,
  jun: 5,
  juni: 5,
  july: 6,
  jul: 6,
  juli: 6,
  august: 7,
  aug: 7,
  agustus: 7,
  agt: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  oktober: 9,
  okt: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
  desember: 11,
  des: 11,
}

function getAllRegexMatches(regex: RegExp, text: string): RegExpExecArray[] {
  const matches: RegExpExecArray[] = []
  const cloned = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g")
  let match: RegExpExecArray | null
  while ((match = cloned.exec(text)) !== null) {
    matches.push(match)
  }
  return matches
}

export function extractMagazineEditionDate(textInput: string): number | null {
  if (!textInput) return null
  const text = textInput.replace(/[_]/g, " ").toLowerCase()

  // 1. Day Month Year: e.g. "29 august - 4 september 2026" or "20 september 2025" or "14 march 2026"
  const dmyMatches = getAllRegexMatches(/(\d{1,2})\s+([a-z]+),?\s+(\d{4})/g, text)
  for (let i = dmyMatches.length - 1; i >= 0; i--) {
    const [, day, mName, year] = dmyMatches[i]
    if (MONTH_MAP[mName] !== undefined) {
      const d = new Date(parseInt(year, 10), MONTH_MAP[mName], parseInt(day, 10))
      if (!isNaN(d.getTime())) return d.getTime()
    }
  }

  // 2. Month Day Year: e.g. "march 21, 2026"
  const mdyMatches = getAllRegexMatches(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/g, text)
  for (let i = mdyMatches.length - 1; i >= 0; i--) {
    const [, mName, day, year] = mdyMatches[i]
    if (MONTH_MAP[mName] !== undefined) {
      const d = new Date(parseInt(year, 10), MONTH_MAP[mName], parseInt(day, 10))
      if (!isNaN(d.getTime())) return d.getTime()
    }
  }

  // 3. Month Year: e.g. "march 2026" or "september 2025"
  const myMatches = getAllRegexMatches(/([a-z]+),?\s+(\d{4})/g, text)
  for (let i = myMatches.length - 1; i >= 0; i--) {
    const [, mName, year] = myMatches[i]
    if (MONTH_MAP[mName] !== undefined) {
      const d = new Date(parseInt(year, 10), MONTH_MAP[mName], 1)
      if (!isNaN(d.getTime())) return d.getTime()
    }
  }

  // 4. 4-digit Year: e.g. "2026", "2025"
  const yMatches = getAllRegexMatches(/\b(19\d\d|20\d\d)\b/g, text)
  if (yMatches.length > 0) {
    const year = parseInt(yMatches[yMatches.length - 1][1], 10)
    return new Date(year, 0, 1).getTime()
  }

  return null
}

export function getMagazineSortTimestamp(mag: {
  title?: string
  issueNumber?: string | null
  created_at?: string | null
}): number {
  const editionDate = extractMagazineEditionDate(`${mag.title || ""} ${mag.issueNumber || ""}`)
  const createdDate = mag.created_at ? new Date(mag.created_at).getTime() : 0

  // If created_at is newer than baseline initial import (approx Oct 10, 2026),
  // it is an explicit recent upload, so prioritize recent upload!
  const OCT_10_2026 = 1791676800000
  if (createdDate > OCT_10_2026) {
    return createdDate
  }

  // Otherwise, use edition date from title/issueNumber
  if (editionDate !== null) {
    return editionDate
  }

  return createdDate > 0 ? createdDate : 0
}

export function sortMagazinesLatestFirst<
  T extends {
    title?: string
    issueNumber?: string | null
    created_at?: string | null
    id?: string
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = getMagazineSortTimestamp(b) - getMagazineSortTimestamp(a)
    if (diff !== 0) return diff
    return (b.id || "").localeCompare(a.id || "")
  })
}
