import { NextRequest, NextResponse } from "next/server"
import {
  getOrders,
  getOrderById,
  getOrdersByCustomerEmail,
  createOrder,
  attachPaymentProof,
  updateOrderStatus,
} from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const id = searchParams.get("id")

  if (id) {
    const order = getOrderById(id)
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    return NextResponse.json(order)
  }

  if (email) {
    const customerOrders = getOrdersByCustomerEmail(email)
    return NextResponse.json(customerOrders)
  }

  const allOrders = getOrders()
  return NextResponse.json(allOrders)
}

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, paymentProofUrl } = await req.json()

    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Name and Gmail address are required" },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No magazines in order" }, { status: 400 })
    }

    const order = createOrder(
      customerName.trim(),
      customerEmail.trim(),
      items,
      paymentProofUrl
    )

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, paymentProofUrl, status, adminNotes } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    if (paymentProofUrl) {
      const updated = attachPaymentProof(orderId, paymentProofUrl)
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 })
      return NextResponse.json(updated)
    }

    if (status) {
      const updated = updateOrderStatus(orderId, status, adminNotes)
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "No valid update operation provided" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
