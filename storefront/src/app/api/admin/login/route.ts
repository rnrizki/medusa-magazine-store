import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const expectedEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@majalahpdf.my.id"
    const expectedPassword = process.env.MEDUSA_ADMIN_PASSWORD || "MajalahPdfAdmin2026!"

    if (
      email &&
      password &&
      email.toLowerCase().trim() === expectedEmail.toLowerCase().trim() &&
      password === expectedPassword
    ) {
      return NextResponse.json({
        success: true,
        user: { email: expectedEmail, role: "admin" },
        token: "admin_token_" + Buffer.from(expectedEmail + ":" + Date.now()).toString("base64"),
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid admin email or password" },
      { status: 401 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
