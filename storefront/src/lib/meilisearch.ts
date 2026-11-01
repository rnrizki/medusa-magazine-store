import { Meilisearch } from "meilisearch"
import { Magazine } from "./types"
import { getMagazines } from "./db"
import { getMagazineThumbnail } from "./thumbnails"
import { getMagazineSortTimestamp, sortMagazinesLatestFirst } from "./magazineSort"

const MEILI_HOST =
  process.env.MEILISEARCH_HOST || "http://meilisearch:7700"
const MEILI_API_KEY =
  process.env.MEILISEARCH_API_KEY ||
  process.env.MEILI_MASTER_KEY ||
  "majalahpdf_meilisearch_master_key_2026_ultra_secure"

let clientInstance: Meilisearch | null = null

export function getMeiliClient(): Meilisearch {
  if (!clientInstance) {
    clientInstance = new Meilisearch({
      host: MEILI_HOST,
      apiKey: MEILI_API_KEY,
      timeout: 2000,
    })
  }
  return clientInstance
}

export const INDEX_NAME = "magazines"

let isInitialized = false

/**
 * Initializes Meilisearch index with optimal typo tolerance,
 * searchable/filterable attributes, and auto-seeds if empty.
 */
export async function initMeiliSearch(): Promise<boolean> {
  if (isInitialized) return true

  try {
    const client = getMeiliClient()

    // 1. Ensure index exists
    let index
    try {
      index = await client.getIndex(INDEX_NAME)
    } catch {
      const task = await client.createIndex(INDEX_NAME, { primaryKey: "id" })
      try {
        await client.tasks.waitForTask(task.taskUid, { timeout: 5000 })
      } catch {}
      index = client.index(INDEX_NAME)
    }

    // 2. Configure index settings (searchable, filterable, ranking)
    await index.updateSettings({
      searchableAttributes: [
        "title",
        "description",
        "categoryName",
        "highlights",
        "issueNumber",
      ],
      filterableAttributes: ["categoryId", "categoryName"],
      sortableAttributes: ["sort_date", "created_at", "price"],
      rankingRules: [
        "words",
        "typo",
        "sort",
        "proximity",
        "attribute",
        "exactness",
      ],
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 3,
          twoTypos: 7,
        },
      },
    })

    // 3. Auto-seed if index is currently empty
    const stats = await index.getStats()
    if (stats.numberOfDocuments === 0) {
      console.log("[Meilisearch] Empty index detected. Auto-seeding from store.json...")
      const initialMagazines = getMagazines()
      if (initialMagazines.length > 0) {
        await syncMagazinesToMeili(initialMagazines)
        console.log(`[Meilisearch] Auto-seeded ${initialMagazines.length} magazines.`)
      }
    }

    isInitialized = true
    return true
  } catch (err: any) {
    console.warn("[Meilisearch] Init warning:", err.message)
    return false
  }
}

/**
 * Adds or updates documents in Meilisearch.
 */
export async function syncMagazinesToMeili(magazines: Magazine[]): Promise<number> {
  if (!magazines || magazines.length === 0) return 0

  try {
    const client = getMeiliClient()
    const index = client.index(INDEX_NAME)

    // Normalize documents for Meilisearch
    const docs = magazines.map((m) => ({
      id: m.id,
      title: m.title,
      issueNumber: m.issueNumber || null,
      categoryId: m.categoryId,
      categoryName: m.categoryName || null,
      price: m.price || 0,
      coverImage: m.coverImage,
      thumbnailUrl: getMagazineThumbnail(m) || m.coverImage,
      description: m.description || "",
      highlights: Array.isArray(m.highlights) ? m.highlights : [],
      pdfUrl: m.pdfUrl || null,
      created_at: m.created_at || new Date().toISOString(),
      sort_date: getMagazineSortTimestamp(m),
    }))

    const task = await index.addDocuments(docs, { primaryKey: "id" })
    try {
      await client.tasks.waitForTask(task.taskUid, { timeout: 5000 })
    } catch {}
    return docs.length
  } catch (err: any) {
    console.warn("[Meilisearch] Sync error:", err.message)
    return 0
  }
}

/**
 * High-speed typo-tolerant search using Meilisearch.
 */
export async function searchMagazinesMeili(
  query: string,
  category?: string,
  limit: number = 100
): Promise<{ magazines: Magazine[]; totalHits: number } | null> {
  if (!query || query.trim() === "") return null

  try {
    const client = getMeiliClient()
    const index = client.index<Magazine>(INDEX_NAME)

    // Build filter if category specified
    let filter: string | undefined = undefined
    if (category && category !== "all") {
      filter = `categoryId = "${category}" OR categoryName = "${category}"`
    }

    const searchResponse = await index.search(query.trim(), {
      limit,
      filter,
      sort: ["sort_date:desc"],
      attributesToHighlight: ["title"],
    })

    const rawMagazines: Magazine[] = searchResponse.hits.map((hit: any) => ({
      id: hit.id,
      title: hit.title,
      issueNumber: hit.issueNumber,
      categoryId: hit.categoryId,
      categoryName: hit.categoryName,
      price: Number(hit.price),
      coverImage: hit.coverImage,
      thumbnailUrl: getMagazineThumbnail(hit),
      description: hit.description,
      highlights: hit.highlights || [],
      pdfUrl: hit.pdfUrl,
      created_at: hit.created_at,
    }))

    const magazines = sortMagazinesLatestFirst(rawMagazines)

    return {
      magazines,
      totalHits: searchResponse.estimatedTotalHits || magazines.length,
    }
  } catch (err: any) {
    console.warn("[Meilisearch] Search error (falling back):", err.message)
    return null
  }
}
