import crypto from "crypto"
import fs from "fs"
import path from "path"

export interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string // e.g. https://s3.us-east-1.amazonaws.com or https://<account>.r2.cloudflarestorage.com
  publicUrl?: string // e.g. https://cdn.yourdomain.com or https://bucket.s3.amazonaws.com
  forcePathStyle?: boolean
}

export function getS3Config(): S3Config | null {
  const bucket = process.env.S3_BUCKET
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null
  }

  return {
    bucket,
    region: process.env.S3_REGION || "us-east-1",
    accessKeyId,
    secretAccessKey,
    endpoint: process.env.S3_ENDPOINT,
    publicUrl: process.env.S3_PUBLIC_URL,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  }
}

/**
 * Uploads a buffer to S3 using AWS Signature Version 4.
 * If S3 credentials are not configured, saves locally to /public/uploads/ as fallback.
 */
export async function uploadToStorage(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/jpeg"
): Promise<{ url: string; storageType: "s3" | "local" }> {
  const s3Config = getS3Config()

  // 1. If S3 is configured, upload to S3 / Cloudflare R2 / MinIO
  if (s3Config) {
    try {
      const s3Url = await uploadToS3(buffer, filename, contentType, s3Config)
      return { url: s3Url, storageType: "s3" }
    } catch (err) {
      console.warn("[S3 Upload Error] Falling back to local storage:", err)
    }
  }

  // 2. Fallback to Local Storage (/public/uploads/)
  const uploadDir = path.join(process.cwd(), "public", "uploads")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const filePath = path.join(uploadDir, safeFilename)
  fs.writeFileSync(filePath, buffer)

  return { url: `/uploads/${safeFilename}`, storageType: "local" }
}

/**
 * AWS Signature Version 4 PUT Object uploader (Zero extra dependencies)
 */
async function uploadToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
  config: S3Config
): Promise<string> {
  const date = new Date()
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.substring(0, 8)

  const region = config.region || "us-east-1"
  const service = "s3"
  const key = `uploads/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  // Parse endpoint or default to AWS S3
  let host = ""
  let requestUrl = ""

  if (config.endpoint) {
    const epUrl = new URL(config.endpoint)
    host = epUrl.host
    if (config.forcePathStyle) {
      requestUrl = `${config.endpoint}/${config.bucket}/${key}`
      host = epUrl.host
    } else {
      host = `${config.bucket}.${epUrl.host}`
      requestUrl = `${epUrl.protocol}//${host}/${key}`
    }
  } else {
    host = `${config.bucket}.s3.${region}.amazonaws.com`
    requestUrl = `https://${host}/${key}`
  }

  const payloadHash = crypto.createHash("sha256").update(buffer).digest("hex")

  // Canonical Request
  const canonicalUri = config.forcePathStyle ? `/${config.bucket}/${key}` : `/${key}`
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  // String to Sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex")
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashedCanonicalRequest}`

  // Signature calculation
  const kDate = crypto.createHmac("sha256", "AWS4" + config.secretAccessKey).update(dateStamp).digest()
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest()
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest()
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest()
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex")

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(requestUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      Host: host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authorizationHeader,
    },
    body: buffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 PutObject failed [${response.status}]: ${errorText}`)
  }

  // Return public URL
  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, "")}/${key}`
  }

  return requestUrl
}
