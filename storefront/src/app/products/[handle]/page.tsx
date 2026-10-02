import React from "react"
import { notFound } from "next/navigation"
import { fetchProductByHandle } from "../../../lib/medusa"
import ProductDetailView from "./ProductDetailView"

export const dynamic = "force-dynamic"

interface ProductPageProps {
  params: {
    handle: string
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await fetchProductByHandle(params.handle)

  if (!product) {
    notFound()
  }

  return <ProductDetailView product={product} />
}
