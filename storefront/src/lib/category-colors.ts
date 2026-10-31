export interface CategoryTheme {
  name: string
  slug: string
  // Hex colors for exact rendering
  primary: string // Active background
  lightBg: string // Inactive background
  textColor: string // Inactive text
  borderColor: string // Inactive border
  dotColor: string // Indicator dot
  // CSS classes for easy Tailwind rendering
  activeStyle: React.CSSProperties
  inactiveStyle: React.CSSProperties
  badgeStyle: React.CSSProperties
}

export const EARTH_TONE_THEMES: Record<string, CategoryTheme> = {
  all: {
    name: "All Magazines",
    slug: "all",
    primary: "#262320", // Deep Charcoal Peat
    lightBg: "#EFECE8",
    textColor: "#2B2724",
    borderColor: "#D8D3CB",
    dotColor: "#756D65",
    activeStyle: { backgroundColor: "#262320", color: "#FFFFFF", borderColor: "#262320" },
    inactiveStyle: { backgroundColor: "#EFECE8", color: "#2B2724", borderColor: "#D8D3CB" },
    badgeStyle: { backgroundColor: "rgba(38, 35, 32, 0.88)", color: "#FFFFFF" },
  },
  business: {
    name: "Business",
    slug: "business",
    primary: "#3D4654", // Slate Granite Earth
    lightBg: "#ECEFF2",
    textColor: "#2A3340",
    borderColor: "#D1D7DF",
    dotColor: "#3D4654",
    activeStyle: { backgroundColor: "#3D4654", color: "#FFFFFF", borderColor: "#3D4654" },
    inactiveStyle: { backgroundColor: "#ECEFF2", color: "#2A3340", borderColor: "#D1D7DF" },
    badgeStyle: { backgroundColor: "rgba(61, 70, 84, 0.90)", color: "#FFFFFF" },
  },
  lifestyle: {
    name: "Lifestyle",
    slug: "lifestyle",
    primary: "#A05035", // Warm Terracotta Clay
    lightBg: "#F7EDE8",
    textColor: "#78341E",
    borderColor: "#E7CEBE",
    dotColor: "#A05035",
    activeStyle: { backgroundColor: "#A05035", color: "#FFFFFF", borderColor: "#A05035" },
    inactiveStyle: { backgroundColor: "#F7EDE8", color: "#78341E", borderColor: "#E7CEBE" },
    badgeStyle: { backgroundColor: "rgba(160, 80, 53, 0.90)", color: "#FFFFFF" },
  },
  design: {
    name: "Design",
    slug: "design",
    primary: "#B5843A", // Warm Ochre Sandstone
    lightBg: "#FAF1E3",
    textColor: "#78531C",
    borderColor: "#EAD5B2",
    dotColor: "#B5843A",
    activeStyle: { backgroundColor: "#B5843A", color: "#FFFFFF", borderColor: "#B5843A" },
    inactiveStyle: { backgroundColor: "#FAF1E3", color: "#78531C", borderColor: "#EAD5B2" },
    badgeStyle: { backgroundColor: "rgba(181, 132, 58, 0.90)", color: "#FFFFFF" },
  },
  fashion: {
    name: "Fashion",
    slug: "fashion",
    primary: "#8F4E5B", // Dusty Rose Earth
    lightBg: "#F8EAEE",
    textColor: "#662E3A",
    borderColor: "#E8C8D2",
    dotColor: "#8F4E5B",
    activeStyle: { backgroundColor: "#8F4E5B", color: "#FFFFFF", borderColor: "#8F4E5B" },
    inactiveStyle: { backgroundColor: "#F8EAEE", color: "#662E3A", borderColor: "#E8C8D2" },
    badgeStyle: { backgroundColor: "rgba(143, 78, 91, 0.90)", color: "#FFFFFF" },
  },
  defense: {
    name: "Defense",
    slug: "defense",
    primary: "#525936", // Olive Drab Army Earth
    lightBg: "#EDF0E3",
    textColor: "#3A4020",
    borderColor: "#D2D8BD",
    dotColor: "#525936",
    activeStyle: { backgroundColor: "#525936", color: "#FFFFFF", borderColor: "#525936" },
    inactiveStyle: { backgroundColor: "#EDF0E3", color: "#3A4020", borderColor: "#D2D8BD" },
    badgeStyle: { backgroundColor: "rgba(82, 89, 54, 0.90)", color: "#FFFFFF" },
  },
  travel: {
    name: "Travel",
    slug: "travel",
    primary: "#BE5C28", // Burnt Raw Sienna
    lightBg: "#FBEDE4",
    textColor: "#80350D",
    borderColor: "#F0CBB6",
    dotColor: "#BE5C28",
    activeStyle: { backgroundColor: "#BE5C28", color: "#FFFFFF", borderColor: "#BE5C28" },
    inactiveStyle: { backgroundColor: "#FBEDE4", color: "#80350D", borderColor: "#F0CBB6" },
    badgeStyle: { backgroundColor: "rgba(190, 92, 40, 0.90)", color: "#FFFFFF" },
  },
  science: {
    name: "Science",
    slug: "science",
    primary: "#3D6648", // Forest Sage Green
    lightBg: "#EBF1ED",
    textColor: "#25482E",
    borderColor: "#C5D8C9",
    dotColor: "#3D6648",
    activeStyle: { backgroundColor: "#3D6648", color: "#FFFFFF", borderColor: "#3D6648" },
    inactiveStyle: { backgroundColor: "#EBF1ED", color: "#25482E", borderColor: "#C5D8C9" },
    badgeStyle: { backgroundColor: "rgba(61, 102, 72, 0.90)", color: "#FFFFFF" },
  },
  automotive: {
    name: "Automotive",
    slug: "automotive",
    primary: "#644636", // Burnt Umber Leather
    lightBg: "#EDE5E0",
    textColor: "#452C20",
    borderColor: "#D4C5BD",
    dotColor: "#644636",
    activeStyle: { backgroundColor: "#644636", color: "#FFFFFF", borderColor: "#644636" },
    inactiveStyle: { backgroundColor: "#EDE5E0", color: "#452C20", borderColor: "#D4C5BD" },
    badgeStyle: { backgroundColor: "rgba(100, 70, 54, 0.90)", color: "#FFFFFF" },
  },
  "for-men": {
    name: "For Men",
    slug: "for-men",
    primary: "#3E332B", // Dark Walnut Earth
    lightBg: "#ECE6E1",
    textColor: "#28201A",
    borderColor: "#D3C8BF",
    dotColor: "#3E332B",
    activeStyle: { backgroundColor: "#3E332B", color: "#FFFFFF", borderColor: "#3E332B" },
    inactiveStyle: { backgroundColor: "#ECE6E1", color: "#28201A", borderColor: "#D3C8BF" },
    badgeStyle: { backgroundColor: "rgba(62, 51, 43, 0.90)", color: "#FFFFFF" },
  },
  sports: {
    name: "Sports",
    slug: "sports",
    primary: "#C37A20", // Warm Amber Earth
    lightBg: "#FAF0E0",
    textColor: "#78470B",
    borderColor: "#EDD4AF",
    dotColor: "#C37A20",
    activeStyle: { backgroundColor: "#C37A20", color: "#FFFFFF", borderColor: "#C37A20" },
    inactiveStyle: { backgroundColor: "#FAF0E0", color: "#78470B", borderColor: "#EDD4AF" },
    badgeStyle: { backgroundColor: "rgba(195, 122, 32, 0.90)", color: "#FFFFFF" },
  },
  comic: {
    name: "Comic",
    slug: "comic",
    primary: "#B54433", // Vintage Comic Brick Rust
    lightBg: "#FAECE9",
    textColor: "#7E2719",
    borderColor: "#ECC8C2",
    dotColor: "#B54433",
    activeStyle: { backgroundColor: "#B54433", color: "#FFFFFF", borderColor: "#B54433" },
    inactiveStyle: { backgroundColor: "#FAECE9", color: "#7E2719", borderColor: "#ECC8C2" },
    badgeStyle: { backgroundColor: "rgba(181, 68, 51, 0.90)", color: "#FFFFFF" },
  },
}

/**
 * Normalizes input name/slug and returns the corresponding Earth Tone theme
 */
export function getCategoryTheme(slugOrName?: string): CategoryTheme {
  if (!slugOrName) return EARTH_TONE_THEMES.all

  const key = slugOrName
    .toLowerCase()
    .trim()
    .replace(/^cat_/, "")
    .replace(/\s+/g, "-")

  if (EARTH_TONE_THEMES[key]) {
    return EARTH_TONE_THEMES[key]
  }

  // Alias checks
  if (key === "formen") return EARTH_TONE_THEMES["for-men"]
  if (key.includes("comic")) return EARTH_TONE_THEMES.comic
  if (key.includes("sport")) return EARTH_TONE_THEMES.sports
  if (key.includes("auto")) return EARTH_TONE_THEMES.automotive
  if (key.includes("scien")) return EARTH_TONE_THEMES.science
  if (key.includes("travel")) return EARTH_TONE_THEMES.travel
  if (key.includes("defen")) return EARTH_TONE_THEMES.defense
  if (key.includes("fash")) return EARTH_TONE_THEMES.fashion
  if (key.includes("design")) return EARTH_TONE_THEMES.design
  if (key.includes("life")) return EARTH_TONE_THEMES.lifestyle
  if (key.includes("busin")) return EARTH_TONE_THEMES.business

  // Default fallback earth tone
  return {
    name: slugOrName,
    slug: key,
    primary: "#5A4E45",
    lightBg: "#EFECE8",
    textColor: "#3A312B",
    borderColor: "#DCD5CD",
    dotColor: "#5A4E45",
    activeStyle: { backgroundColor: "#5A4E45", color: "#FFFFFF", borderColor: "#5A4E45" },
    inactiveStyle: { backgroundColor: "#EFECE8", color: "#3A312B", borderColor: "#DCD5CD" },
    badgeStyle: { backgroundColor: "rgba(90, 78, 69, 0.90)", color: "#FFFFFF" },
  }
}
