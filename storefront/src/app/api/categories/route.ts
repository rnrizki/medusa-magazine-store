import { NextRequest, NextResponse } from "next/server"
import { getCategories, addCategory, deleteCategory } from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const categories = getCategories()
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json()
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }
    const created = addCategory(name.trim(), description)
    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }
    const success = deleteCategory(id)
    if (!success) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: "Category deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
