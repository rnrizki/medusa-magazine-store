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

/**
 * 16-color modern pastel palette mapped to each category.
 * Hex codes directly from user palette specification:
 * #FF81B1, #FAADC2, #AEACFF, #D5CBFA
 * #2A68B6, #88BBFF, #BFE3F8, #50A679
 * #A9CDA7, #CEDF97, #FF8A8A, #FFBFA9
 * #FFAF7D, #FFCE8F, #FFCF0D, #FFEDA5
 */
export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  all: {
    name: "All Magazines",
    slug: "all",
    primary: "#2A68B6", // Deep Cobalt Blue (#2A68B6)
    lightBg: "#EBF3FC", // Light Ice Blue tint
    textColor: "#153C6F",
    borderColor: "#88BBFF", // #88BBFF
    dotColor: "#2A68B6",
    activeStyle: { backgroundColor: "#2A68B6", color: "#FFFFFF", borderColor: "#2A68B6" },
    inactiveStyle: { backgroundColor: "#EBF3FC", color: "#153C6F", borderColor: "#88BBFF" },
    badgeStyle: { backgroundColor: "rgba(42, 104, 182, 0.95)", color: "#FFFFFF" },
  },
  business: {
    name: "Business",
    slug: "business",
    primary: "#2A68B6", // #2A68B6
    lightBg: "#DCEFFB", // #BFE3F8 family
    textColor: "#133E75",
    borderColor: "#88BBFF", // #88BBFF
    dotColor: "#2A68B6",
    activeStyle: { backgroundColor: "#2A68B6", color: "#FFFFFF", borderColor: "#2A68B6" },
    inactiveStyle: { backgroundColor: "#DCEFFB", color: "#133E75", borderColor: "#88BBFF" },
    badgeStyle: { backgroundColor: "rgba(42, 104, 182, 0.95)", color: "#FFFFFF" },
  },
  lifestyle: {
    name: "Lifestyle",
    slug: "lifestyle",
    primary: "#AEACFF", // #AEACFF
    lightBg: "#F0EEFE", // #D5CBFA family
    textColor: "#433D9E",
    borderColor: "#D5CBFA", // #D5CBFA
    dotColor: "#AEACFF",
    activeStyle: { backgroundColor: "#AEACFF", color: "#FFFFFF", borderColor: "#AEACFF" },
    inactiveStyle: { backgroundColor: "#F0EEFE", color: "#433D9E", borderColor: "#D5CBFA" },
    badgeStyle: { backgroundColor: "rgba(150, 146, 250, 0.95)", color: "#FFFFFF" },
  },
  design: {
    name: "Design",
    slug: "design",
    primary: "#D5CBFA", // #D5CBFA
    lightBg: "#F5F3FF",
    textColor: "#3D2B70",
    borderColor: "#AEACFF", // #AEACFF
    dotColor: "#AEACFF",
    activeStyle: { backgroundColor: "#D5CBFA", color: "#2E1C60", borderColor: "#AEACFF" },
    inactiveStyle: { backgroundColor: "#F5F3FF", color: "#3D2B70", borderColor: "#D5CBFA" },
    badgeStyle: { backgroundColor: "rgba(195, 184, 250, 0.95)", color: "#2E1C60" },
  },
  fashion: {
    name: "Fashion",
    slug: "fashion",
    primary: "#FF81B1", // #FF81B1
    lightBg: "#FFF0F5",
    textColor: "#8A1440",
    borderColor: "#FAADC2", // #FAADC2
    dotColor: "#FF81B1",
    activeStyle: { backgroundColor: "#FF81B1", color: "#FFFFFF", borderColor: "#FF81B1" },
    inactiveStyle: { backgroundColor: "#FFF0F5", color: "#8A1440", borderColor: "#FAADC2" },
    badgeStyle: { backgroundColor: "rgba(255, 129, 177, 0.95)", color: "#FFFFFF" },
  },
  defense: {
    name: "Defense",
    slug: "defense",
    primary: "#50A679", // #50A679
    lightBg: "#EFF7F2",
    textColor: "#174D2E",
    borderColor: "#A9CDA7", // #A9CDA7
    dotColor: "#50A679",
    activeStyle: { backgroundColor: "#50A679", color: "#FFFFFF", borderColor: "#50A679" },
    inactiveStyle: { backgroundColor: "#EFF7F2", color: "#174D2E", borderColor: "#A9CDA7" },
    badgeStyle: { backgroundColor: "rgba(80, 166, 121, 0.95)", color: "#FFFFFF" },
  },
  travel: {
    name: "Travel",
    slug: "travel",
    primary: "#88BBFF", // #88BBFF
    lightBg: "#F0F7FF",
    textColor: "#154687",
    borderColor: "#BFE3F8", // #BFE3F8
    dotColor: "#88BBFF",
    activeStyle: { backgroundColor: "#88BBFF", color: "#FFFFFF", borderColor: "#88BBFF" },
    inactiveStyle: { backgroundColor: "#F0F7FF", color: "#154687", borderColor: "#BFE3F8" },
    badgeStyle: { backgroundColor: "rgba(110, 170, 252, 0.95)", color: "#FFFFFF" },
  },
  science: {
    name: "Science",
    slug: "science",
    primary: "#CEDF97", // #CEDF97
    lightBg: "#F7FAEC",
    textColor: "#3F520B",
    borderColor: "#CEDF97",
    dotColor: "#8FA83E",
    activeStyle: { backgroundColor: "#CEDF97", color: "#2B3A04", borderColor: "#B8CB7C" },
    inactiveStyle: { backgroundColor: "#F7FAEC", color: "#3F520B", borderColor: "#CEDF97" },
    badgeStyle: { backgroundColor: "rgba(195, 212, 135, 0.95)", color: "#2B3A04" },
  },
  automotive: {
    name: "Automotive",
    slug: "automotive",
    primary: "#FFAF7D", // #FFAF7D
    lightBg: "#FFF5EF",
    textColor: "#8A3B08",
    borderColor: "#FFCE8F", // #FFCE8F
    dotColor: "#FFAF7D",
    activeStyle: { backgroundColor: "#FFAF7D", color: "#FFFFFF", borderColor: "#FFAF7D" },
    inactiveStyle: { backgroundColor: "#FFF5EF", color: "#8A3B08", borderColor: "#FFCE8F" },
    badgeStyle: { backgroundColor: "rgba(255, 175, 125, 0.95)", color: "#FFFFFF" },
  },
  "for-men": {
    name: "For Men",
    slug: "for-men",
    primary: "#A9CDA7", // #A9CDA7
    lightBg: "#F1F7F1",
    textColor: "#274F29",
    borderColor: "#A9CDA7",
    dotColor: "#50A679",
    activeStyle: { backgroundColor: "#A9CDA7", color: "#1B3B1D", borderColor: "#8EBC8C" },
    inactiveStyle: { backgroundColor: "#F1F7F1", color: "#274F29", borderColor: "#A9CDA7" },
    badgeStyle: { backgroundColor: "rgba(155, 195, 153, 0.95)", color: "#1B3B1D" },
  },
  sports: {
    name: "Sports",
    slug: "sports",
    primary: "#FFCF0D", // #FFCF0D
    lightBg: "#FFFDEB",
    textColor: "#785800",
    borderColor: "#FFEDA5", // #FFEDA5
    dotColor: "#FFCF0D",
    activeStyle: { backgroundColor: "#FFCF0D", color: "#3B2C00", borderColor: "#FFCF0D" },
    inactiveStyle: { backgroundColor: "#FFFDEB", color: "#785800", borderColor: "#FFEDA5" },
    badgeStyle: { backgroundColor: "rgba(255, 207, 13, 0.95)", color: "#3B2C00" },
  },
  comic: {
    name: "Comic",
    slug: "comic",
    primary: "#FF8A8A", // #FF8A8A
    lightBg: "#FFF2F2",
    textColor: "#992121",
    borderColor: "#FFBFA9", // #FFBFA9
    dotColor: "#FF8A8A",
    activeStyle: { backgroundColor: "#FF8A8A", color: "#FFFFFF", borderColor: "#FF8A8A" },
    inactiveStyle: { backgroundColor: "#FFF2F2", color: "#992121", borderColor: "#FFBFA9" },
    badgeStyle: { backgroundColor: "rgba(255, 138, 138, 0.95)", color: "#FFFFFF" },
  },
}

// Backwards-compatibility alias
export const EARTH_TONE_THEMES = CATEGORY_THEMES

/**
 * Normalizes input name/slug and returns the corresponding CategoryTheme from the palette
 */
export function getCategoryTheme(slugOrName?: string): CategoryTheme {
  if (!slugOrName) return CATEGORY_THEMES.all

  const key = slugOrName
    .toLowerCase()
    .trim()
    .replace(/^cat_/, "")
    .replace(/\s+/g, "-")

  if (CATEGORY_THEMES[key]) {
    return CATEGORY_THEMES[key]
  }

  // Alias checks
  if (key === "formen") return CATEGORY_THEMES["for-men"]
  if (key.includes("comic")) return CATEGORY_THEMES.comic
  if (key.includes("sport")) return CATEGORY_THEMES.sports
  if (key.includes("auto")) return CATEGORY_THEMES.automotive
  if (key.includes("scien")) return CATEGORY_THEMES.science
  if (key.includes("travel")) return CATEGORY_THEMES.travel
  if (key.includes("defen")) return CATEGORY_THEMES.defense
  if (key.includes("fash")) return CATEGORY_THEMES.fashion
  if (key.includes("design")) return CATEGORY_THEMES.design
  if (key.includes("life")) return CATEGORY_THEMES.lifestyle
  if (key.includes("busin")) return CATEGORY_THEMES.business

  // Fallback
  return CATEGORY_THEMES.all
}
