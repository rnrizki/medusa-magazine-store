import { google } from "googleapis"
import path from "path"
import fs from "fs"

// Service account file path or environment variable fallback
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), "service-account.json")

function getDriveClient() {
  let auth: any

  if (process.env.GDRIVE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GDRIVE_CREDENTIALS_JSON)
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive"],
      })
    } catch (e) {
      console.error("[GDrive] Error parsing GDRIVE_CREDENTIALS_JSON env:", e)
    }
  }

  if (!auth && fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ["https://www.googleapis.com/auth/drive"],
    })
  }

  if (!auth) {
    throw new Error("[GDrive] No Google Drive credentials found (service-account.json or GDRIVE_CREDENTIALS_JSON).")
  }

  return google.drive({ version: "v3", auth })
}

/**
 * Extracts the Google Drive file ID from a full Drive URL or returns the raw ID
 */
export function extractDriveFileId(urlOrId?: string): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()
  
  // Format: /file/d/FILE_ID/...
  const matchD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (matchD && matchD[1]) return matchD[1]

  // Format: id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (matchId && matchId[1]) return matchId[1]

  // Format: Raw alphanumeric file ID (typically 25 to 50 chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

export interface ShareResult {
  fileId: string
  title: string
  success: boolean
  webViewLink?: string
  webContentLink?: string
  error?: string
}

/**
 * Automatically shares a Google Drive file with the buyer's Gmail address as 'reader'
 */
export async function shareFileWithBuyer(
  fileIdOrUrl: string,
  buyerEmail: string,
  title: string = "Magazine PDF"
): Promise<ShareResult> {
  const fileId = extractDriveFileId(fileIdOrUrl)

  if (!fileId) {
    return {
      fileId: fileIdOrUrl,
      title,
      success: false,
      error: "Invalid Google Drive File ID or URL",
    }
  }

  try {
    const drive = getDriveClient()

    // 1. Grant 'reader' access to buyer's Gmail
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "user",
        emailAddress: buyerEmail.trim().toLowerCase(),
      },
      // sendNotificationEmail: false so we can send our own custom-branded email
      sendNotificationEmail: false,
    })

    // 2. Fetch the direct view link and download link
    const fileRes = await drive.files.get({
      fileId,
      fields: "id, name, webViewLink, webContentLink",
    })

    const webViewLink =
      fileRes.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view?usp=sharing`

    return {
      fileId,
      title: fileRes.data.name || title,
      success: true,
      webViewLink,
      webContentLink: fileRes.data.webContentLink || undefined,
    }
  } catch (error: any) {
    // If the buyer already has access, Google returns a specific error or 409
    const msg = error.message || String(error)
    if (msg.includes("already has access") || error.code === 409) {
      const drive = getDriveClient()
      const fileRes = await drive.files.get({
        fileId,
        fields: "id, name, webViewLink, webContentLink",
      }).catch(() => null)

      return {
        fileId,
        title,
        success: true,
        webViewLink:
          fileRes?.data?.webViewLink ||
          `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
        webContentLink: fileRes?.data?.webContentLink || undefined,
      }
    }

    console.error(`[GDrive] Failed to share file ${fileId} with ${buyerEmail}:`, msg)
    return {
      fileId,
      title,
      success: false,
      error: msg,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    }
  }
}

/**
 * Shares all purchased magazine PDFs with the buyer's Gmail
 */
export async function shareOrderItemsWithBuyer(
  items: Array<{ title: string; pdfUrl?: string }>,
  buyerEmail: string
): Promise<ShareResult[]> {
  const results: ShareResult[] = []

  for (const item of items) {
    if (!item.pdfUrl) {
      results.push({
        fileId: "",
        title: item.title,
        success: false,
        error: "Item has no pdfUrl defined",
      })
      continue
    }

    const res = await shareFileWithBuyer(item.pdfUrl, buyerEmail, item.title)
    results.push(res)
  }

  return results
}
