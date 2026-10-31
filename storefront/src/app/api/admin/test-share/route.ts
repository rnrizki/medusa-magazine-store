import { NextRequest, NextResponse } from "next/server"
import { getMagazines, getMagazineById } from "../../../../lib/db"
import { shareFileWithBuyer } from "../../../../lib/gdrive"
import { sendOrderConfirmationEmail } from "../../../../lib/mailer"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { email, magazineId } = await req.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid recipient email address is required" },
        { status: 400 }
      )
    }

    const all = getMagazines()
    const targetMagazine = magazineId ? getMagazineById(magazineId) : all[0]

    if (!targetMagazine || !targetMagazine.pdfUrl) {
      return NextResponse.json(
        { error: "No valid magazine with pdfUrl found for test" },
        { status: 404 }
      )
    }

    console.log(`[Test-Share] Sharing "${targetMagazine.title}" with ${email}...`)
    const shareResult = await shareFileWithBuyer(
      targetMagazine.pdfUrl,
      email,
      targetMagazine.title
    )

    console.log(`[Test-Share] Sending test email to ${email}...`)
    const mockOrder: any = {
      id: "ord_test_" + Date.now(),
      orderCode: "TEST-" + Math.floor(1000 + Math.random() * 9000),
      customerName: email.split("@")[0],
      customerEmail: email,
      items: [
        {
          magazineId: targetMagazine.id,
          title: targetMagazine.title,
          issueNumber: targetMagazine.issueNumber,
          coverImage: targetMagazine.coverImage,
          price: targetMagazine.price,
          pdfUrl: targetMagazine.pdfUrl,
        },
      ],
      totalAmount: targetMagazine.price,
      status: "verified",
      createdAt: new Date().toISOString(),
    }

    const emailResult = await sendOrderConfirmationEmail(mockOrder, [shareResult])

    return NextResponse.json({
      success: true,
      message: "Test completed",
      targetMagazine: {
        id: targetMagazine.id,
        title: targetMagazine.title,
        pdfUrl: targetMagazine.pdfUrl,
      },
      shareResult,
      emailResult,
    })
  } catch (err: any) {
    console.error("[Test-Share Error]:", err)
    return NextResponse.json(
      { error: err.message || "Unknown error during test" },
      { status: 500 }
    )
  }
}
