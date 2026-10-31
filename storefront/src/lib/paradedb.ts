import { Pool } from "pg"
import { Magazine } from "./types"
import { getMagazines } from "./db"

const connectionString =
  process.env.PARADEDB_URL ||
  process.env.DATABASE_URL ||
  "postgres://postgres:majalahpdf_secure_db_pass_2026!@paradedb:5432/search_db"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 30000,
      max: 15,
    })
    pool.on("error", (err) => {
      console.warn("[ParadeDB] Pool error:", err.message)
    })
  }
  return pool
}

let isInitialized = false

export async function initParadeDb(): Promise<boolean> {
  if (isInitialized) return true
  try {
    const client = await getPool().connect()
    try {
      // 1. Enable ParadeDB pg_search extension
      await client.query("CREATE EXTENSION IF NOT EXISTS pg_search;")

      // 2. Create magazine search table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS magazine_search (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          issue_number TEXT,
          category_id TEXT,
          category_name TEXT,
          price NUMERIC,
          cover_image TEXT,
          thumbnail_url TEXT,
          description TEXT,
          highlights JSONB,
          pdf_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `)

      // 3. Create ParadeDB BM25 index
      await client.query(`
        CREATE INDEX IF NOT EXISTS magazine_search_bm25_idx
        ON magazine_search
        USING bm25 (id, title, description, category_name)
        WITH (key_field = 'id');
      `)

      // 4. Auto-seed if empty
      const checkCount = await client.query("SELECT COUNT(*) FROM magazine_search;")
      const count = parseInt(checkCount.rows[0]?.count || "0", 10)
      if (count === 0) {
        console.log("[ParadeDB] Empty search table detected. Auto-seeding from store.json...")
        const initialMagazines = getMagazines()
        if (initialMagazines.length > 0) {
          for (const mag of initialMagazines) {
            await client.query(
              `
              INSERT INTO magazine_search (
                id, title, issue_number, category_id, category_name, price,
                cover_image, thumbnail_url, description, highlights, pdf_url, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO NOTHING;
              `,
              [
                mag.id,
                mag.title,
                mag.issueNumber || null,
                mag.categoryId,
                mag.categoryName || null,
                mag.price || 0,
                mag.coverImage,
                mag.thumbnailUrl || null,
                mag.description || "",
                JSON.stringify(mag.highlights || []),
                mag.pdfUrl || null,
                mag.created_at || new Date().toISOString(),
              ]
            )
          }
          console.log(`[ParadeDB] Auto-seeded ${initialMagazines.length} magazines into BM25 index.`)
        }
      }

      isInitialized = true
      return true
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.warn("[ParadeDB] Initialization warning:", err.message)
    return false
  }
}

export async function syncMagazinesToParadeDb(magazines: Magazine[]): Promise<number> {
  const ready = await initParadeDb()
  if (!ready || magazines.length === 0) return 0

  try {
    const client = await getPool().connect()
    try {
      await client.query("BEGIN")
      let count = 0
      for (const mag of magazines) {
        await client.query(
          `
          INSERT INTO magazine_search (
            id, title, issue_number, category_id, category_name, price,
            cover_image, thumbnail_url, description, highlights, pdf_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            issue_number = EXCLUDED.issue_number,
            category_id = EXCLUDED.category_id,
            category_name = EXCLUDED.category_name,
            price = EXCLUDED.price,
            cover_image = EXCLUDED.cover_image,
            thumbnail_url = EXCLUDED.thumbnail_url,
            description = EXCLUDED.description,
            highlights = EXCLUDED.highlights,
            pdf_url = EXCLUDED.pdf_url,
            created_at = EXCLUDED.created_at;
          `,
          [
            mag.id,
            mag.title,
            mag.issueNumber || null,
            mag.categoryId,
            mag.categoryName || null,
            mag.price || 0,
            mag.coverImage,
            mag.thumbnailUrl || null,
            mag.description || "",
            JSON.stringify(mag.highlights || []),
            mag.pdfUrl || null,
            mag.created_at || new Date().toISOString(),
          ]
        )
        count++
      }
      await client.query("COMMIT")
      return count
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.warn("[ParadeDB] Sync error:", err.message)
    return 0
  }
}

/**
 * Builds a robust Tantivy/ParadeDB BM25 search expression with prefix and fuzzy matching.
 * Handles partial queries like 'photo' -> matches 'photography'
 * Handles typos like 'potography' -> matches 'photography'
 * Strips dangerous syntax characters that cause Tantivy parser errors.
 */
export function buildParadeQuery(rawQuery: string): string {
  const words = rawQuery
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return ""

  return words
    .map((w) => {
      // If it's a number (e.g. 2024), exact match or prefix
      if (/^\d+$/.test(w)) {
        return `(${w} OR ${w}*)`
      }
      // Very short terms (1-2 chars): prefix only
      if (w.length <= 2) {
        return `${w}*`
      }
      // Medium to long terms: exact OR prefix OR fuzzy (distance 1)
      return `(${w} OR ${w}* OR ${w}~1)`
    })
    .join(" AND ")
}

/**
 * Fast BM25 Search without DDL lock overhead.
 * Target execution time: 2ms - 15ms.
 */
export async function searchMagazinesParadeDb(
  query: string,
  category?: string,
  limit: number = 40
): Promise<{ magazines: Magazine[]; bm25Scores: Record<string, number> } | null> {
  if (!query || query.trim() === "") return null

  const paradeQuery = buildParadeQuery(query)
  if (!paradeQuery) return null

  try {
    const client = await getPool().connect()
    try {
      let sql: string
      let params: any[]

      if (category && category !== "all") {
        sql = `
          SELECT id, title, issue_number, category_id, category_name, price,
                 cover_image, thumbnail_url, description, highlights, pdf_url, created_at,
                 paradedb.score(id) AS bm25_score
          FROM magazine_search
          WHERE magazine_search @@@ $1
            AND (category_id = $2 OR LOWER(category_name) = LOWER($2))
          ORDER BY bm25_score DESC
          LIMIT $3;
        `
        params = [paradeQuery, category, limit]
      } else {
        sql = `
          SELECT id, title, issue_number, category_id, category_name, price,
                 cover_image, thumbnail_url, description, highlights, pdf_url, created_at,
                 paradedb.score(id) AS bm25_score
          FROM magazine_search
          WHERE magazine_search @@@ $1
          ORDER BY bm25_score DESC
          LIMIT $2;
        `
        params = [paradeQuery, limit]
      }

      const res = await client.query(sql, params)
      const bm25Scores: Record<string, number> = {}

      const magazines: Magazine[] = res.rows.map((row: any) => {
        bm25Scores[row.id] = parseFloat(row.bm25_score || "0")
        return {
          id: row.id,
          title: row.title,
          issueNumber: row.issue_number,
          categoryId: row.category_id,
          categoryName: row.category_name,
          price: Number(row.price),
          coverImage: row.cover_image,
          thumbnailUrl: row.thumbnail_url,
          description: row.description,
          highlights: Array.isArray(row.highlights)
            ? row.highlights
            : typeof row.highlights === "string"
            ? JSON.parse(row.highlights || "[]")
            : [],
          pdfUrl: row.pdf_url,
          created_at: row.created_at,
        }
      })

      return { magazines, bm25Scores }
    } finally {
      client.release()
    }
  } catch (err: any) {
    // If table does not exist yet (code 42P01), initialize once in background
    if (err.code === "42P01" || err.message?.includes("does not exist")) {
      initParadeDb().catch(() => {})
    }
    console.warn("[ParadeDB] Search error (falling back to local):", err.message)
    return null
  }
}
