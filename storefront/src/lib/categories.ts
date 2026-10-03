export const ALLOWED_CATEGORIES = [
  "Business",
  "Lifestyle",
  "Design",
  "Fashion",
  "Defense",
  "Travel",
  "Science",
  "Automotive",
  "For Men",
  "Sports",
] as const

export type AllowedCategory = typeof ALLOWED_CATEGORIES[number]

/**
 * Normalizes any category string or title keywords strictly into one of the 10 allowed categories.
 * Nothing else is permitted.
 */
export function normalizeToAllowedCategory(rawCat?: string, title: string = ""): AllowedCategory {
  if (rawCat) {
    const cleaned = rawCat.trim().toLowerCase()
    for (const allowed of ALLOWED_CATEGORIES) {
      if (allowed.toLowerCase() === cleaned) return allowed
    }
    // Partial substring match
    for (const allowed of ALLOWED_CATEGORIES) {
      if (cleaned.includes(allowed.toLowerCase()) || allowed.toLowerCase().includes(cleaned)) {
        return allowed
      }
    }
  }

  // Fallback keyword classifier based on title
  const t = title.toLowerCase()

  if (/\b(defense|defence|military|army|navy|war|warfare|weapons?|tactical|combat|soldier|air force|fighter jet|nato|pentagon|ballistic|stealth|sniper|submarine|arms|special forces)\b/i.test(t)) {
    return "Defense"
  }
  if (/\b(auto|automotive|car|cars|hypercar|supercar|porsche|ferrari|lamborghini|motor|racing|f1|formula|nurburgring|trackday|horsepower|turbo|v12|speed|motorsport|le mans)\b/i.test(t)) {
    return "Automotive"
  }
  if (/\b(fashion|vogue|couture|runway|apparel|style|model|textile|denim|streetwear|catwalk|lookbook|attire|tailor|glamour|paris fashion|milan|outfit)\b/i.test(t)) {
    return "Fashion"
  }
  if (/\b(design|architect|architecture|interior|brutalist|decor|spatial|building|furniture|modernism|urban|monolith|villa|scandi|minimalism|blueprint)\b/i.test(t)) {
    return "Design"
  }
  if (/\b(science|tech|technology|ai|artificial intelligence|quantum|neural|robot|space|physics|astronomy|bio|computing|silicon|cyber|code|synthetic|laboratory|nasa)\b/i.test(t)) {
    return "Science"
  }
  if (/\b(business|finance|money|wealth|economy|economic|market|stock|invest|ceo|forbes|fortune|entrepreneur|startup|venture|trade|wall street|bloomberg|banking)\b/i.test(t)) {
    return "Business"
  }
  if (/\b(travel|wanderlust|journey|voyage|destination|island|flight|hotel|resort|safari|tour|bali|explore|adventure|escapade|vacation|globetrotter)\b/i.test(t)) {
    return "Travel"
  }
  if (/\b(men|man|gentleman|gq|masculine|grooming|brotherhood|menswear|beard|men fitness|esquire)\b/i.test(t)) {
    return "For Men"
  }
  if (/\b(sport|sports|athletic|athlete|football|soccer|basketball|tennis|nba|olympics|championship|tournament|esports|fitness|stadium|fifa|league)\b/i.test(t)) {
    return "Sports"
  }

  return "Lifestyle"
}
