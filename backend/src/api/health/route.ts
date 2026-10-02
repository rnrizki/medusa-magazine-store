import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = (req: MedusaRequest, res: MedusaResponse) => {
  res.status(200).json({
    status: "healthy",
    framework: "Medusa v2",
    timestamp: new Date().toISOString(),
  })
}
