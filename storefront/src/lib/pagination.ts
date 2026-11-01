/**
 * Generates an array of page numbers and ellipsis ("...") for compact pagination.
 * Shows at most 3 pages before and 3 pages after the active page,
 * with first page (1) and last page (totalPages) always accessible.
 */
export function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  if (totalPages <= 1) return []

  const items: (number | "...")[] = []
  const start = Math.max(1, currentPage - 3)
  const end = Math.min(totalPages, currentPage + 3)

  if (start > 1) {
    items.push(1)
    if (start > 2) {
      items.push("...")
    }
  }

  for (let i = start; i <= end; i++) {
    items.push(i)
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      items.push("...")
    }
    items.push(totalPages)
  }

  return items
}

/**
 * Format page numbers with leading zero when total pages >= 10 (e.g. 01, 02, 09, 10).
 */
export function formatPageNumber(page: number, totalPages: number): string {
  if (totalPages >= 10 && page < 10) {
    return `0${page}`
  }
  return `${page}`
}
