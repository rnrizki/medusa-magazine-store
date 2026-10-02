import { NextRequest, NextResponse } from "next/server"
import {
  getConversations,
  getConversationByEmail,
  sendChatMessage,
  markChatAsRead,
} from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (email) {
    const conv = getConversationByEmail(email)
    return NextResponse.json(
      conv || {
        customerEmail: email,
        customerName: email.split("@")[0],
        messages: [],
        updatedAt: new Date().toISOString(),
      }
    )
  }

  const all = getConversations()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerEmail,
      customerName,
      sender,
      senderName,
      text,
      imageUrl,
      productEmbed,
    } = body

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      )
    }

    if (!text && !imageUrl && !productEmbed) {
      return NextResponse.json(
        { error: "Message must contain text, an image, or an embedded product" },
        { status: 400 }
      )
    }

    const result = sendChatMessage({
      customerEmail,
      customerName,
      sender: sender === "admin" ? "admin" : "customer",
      senderName,
      text,
      imageUrl,
      productEmbed,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { customerEmail, reader } = await req.json()
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      )
    }

    const success = markChatAsRead(
      customerEmail,
      reader === "admin" ? "admin" : "customer"
    )
    return NextResponse.json({ success })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
