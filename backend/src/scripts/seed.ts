import { ExecArgs } from "@medusajs/framework/types"
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createProductsWorkflow,
  createApiKeysWorkflow,
} from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info("==================================================")
  logger.info("🌱 Starting Medusa v2 Store Demo Seeding...")
  logger.info("==================================================")

  try {
    // 1. Create or ensure default sales channel
    let defaultSalesChannelId: string | undefined
    try {
      logger.info("📦 Checking / Creating Default Sales Channel...")
      const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
      const existingChannels = await salesChannelService.listSalesChannels({})

      if (existingChannels.length > 0) {
        defaultSalesChannelId = existingChannels[0].id
        logger.info(`ℹ️ Using existing Sales Channel: ${existingChannels[0].name} (${defaultSalesChannelId})`)
      } else {
        const { result: channelResult } = await createSalesChannelsWorkflow(container).run({
          input: {
            salesChannelsData: [
              {
                name: "Default Storefront",
                description: "Main ecommerce storefront sales channel",
              },
            ],
          },
        })
        defaultSalesChannelId = channelResult[0]?.id
        logger.info(`✅ Created Sales Channel: ${defaultSalesChannelId}`)
      }
    } catch (scErr: any) {
      logger.warn(`Notice while configuring sales channel: ${scErr.message}`)
    }

    // 2. Create or ensure Regions
    try {
      logger.info("🌍 Checking / Creating Store Regions (US & EU)...")
      const regionService = container.resolve(Modules.REGION)
      const existingRegions = await regionService.listRegions({})

      if (existingRegions.length === 0) {
        await createRegionsWorkflow(container).run({
          input: {
            regions: [
              {
                name: "North America",
                currency_code: "usd",
                countries: ["us", "ca"],
              },
              {
                name: "Europe",
                currency_code: "eur",
                countries: ["de", "fr", "es", "it", "nl"],
              },
            ],
          },
        })
        logger.info("✅ Created North America ($ USD) and Europe (€ EUR) regions.")
      } else {
        logger.info(`ℹ️ Regions already present (${existingRegions.length} found). Skipping region creation.`)
      }
    } catch (regErr: any) {
      logger.warn(`Notice while configuring regions: ${regErr.message}`)
    }

    // 3. Create Sample Products
    try {
      logger.info("🛍️ Checking / Creating Sample Ecommerce Products...")
      const productService = container.resolve(Modules.PRODUCT)
      const existingProducts = await productService.listProducts({})

      if (existingProducts.length === 0) {
        await createProductsWorkflow(container).run({
          input: {
            products: [
              {
                title: "Medusa Minimalist Hoodie",
                subtitle: "Premium organic heavyweight cotton blend",
                description:
                  "Designed for everyday comfort with ultra-soft fleece backing, reinforced stitching, and a tailored contemporary fit.",
                handle: "medusa-minimalist-hoodie",
                is_giftcard: false,
                discountable: true,
                thumbnail:
                  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
                options: [
                  {
                    title: "Size",
                    values: ["S", "M", "L", "XL"],
                  },
                  {
                    title: "Color",
                    values: ["Matte Black", "Heather Gray"],
                  },
                ],
                variants: [
                  {
                    title: "Matte Black / M",
                    sku: "HOODIE-BLK-M",
                    options: { Size: "M", Color: "Matte Black" },
                    prices: [
                      { currency_code: "usd", amount: 7900 },
                      { currency_code: "eur", amount: 7500 },
                    ],
                  },
                  {
                    title: "Matte Black / L",
                    sku: "HOODIE-BLK-L",
                    options: { Size: "L", Color: "Matte Black" },
                    prices: [
                      { currency_code: "usd", amount: 7900 },
                      { currency_code: "eur", amount: 7500 },
                    ],
                  },
                  {
                    title: "Heather Gray / M",
                    sku: "HOODIE-GRY-M",
                    options: { Size: "M", Color: "Heather Gray" },
                    prices: [
                      { currency_code: "usd", amount: 7900 },
                      { currency_code: "eur", amount: 7500 },
                    ],
                  },
                ],
                sales_channels: defaultSalesChannelId ? [{ id: defaultSalesChannelId }] : undefined,
              },
              {
                title: "Medusa Core Cotton T-Shirt",
                subtitle: "100% combed ring-spun breathable cotton",
                description:
                  "The staple tee your wardrobe needs. Soft-washed finish with pre-shrunk fabric to retain its shape wash after wash.",
                handle: "medusa-core-tshirt",
                is_giftcard: false,
                discountable: true,
                thumbnail:
                  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
                options: [
                  {
                    title: "Size",
                    values: ["S", "M", "L"],
                  },
                  {
                    title: "Color",
                    values: ["Vintage White", "Jet Black"],
                  },
                ],
                variants: [
                  {
                    title: "Vintage White / M",
                    sku: "TSHIRT-WHT-M",
                    options: { Size: "M", Color: "Vintage White" },
                    prices: [
                      { currency_code: "usd", amount: 3500 },
                      { currency_code: "eur", amount: 3200 },
                    ],
                  },
                  {
                    title: "Jet Black / L",
                    sku: "TSHIRT-BLK-L",
                    options: { Size: "L", Color: "Jet Black" },
                    prices: [
                      { currency_code: "usd", amount: 3500 },
                      { currency_code: "eur", amount: 3200 },
                    ],
                  },
                ],
                sales_channels: defaultSalesChannelId ? [{ id: defaultSalesChannelId }] : undefined,
              },
              {
                title: "Ceramic Matte Coffee Mug",
                subtitle: "12oz handcrafted ceramic drinkware",
                description:
                  "Ergonomic handle and satin-matte stoneware finish. Microwave and dishwasher safe, crafted for hot espresso or cold brew.",
                handle: "ceramic-matte-coffee-mug",
                is_giftcard: false,
                discountable: true,
                thumbnail:
                  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
                options: [
                  {
                    title: "Finish",
                    values: ["Charcoal", "Sand Stone"],
                  },
                ],
                variants: [
                  {
                    title: "Charcoal",
                    sku: "MUG-CHAR",
                    options: { Finish: "Charcoal" },
                    prices: [
                      { currency_code: "usd", amount: 2200 },
                      { currency_code: "eur", amount: 2000 },
                    ],
                  },
                ],
                sales_channels: defaultSalesChannelId ? [{ id: defaultSalesChannelId }] : undefined,
              },
              {
                title: "Minimal Canvas Cap",
                subtitle: "Unstructured 6-panel adjustable cotton twill",
                description:
                  "Classic curved brim, brass metal buckle strap adjustment, and clean tone-on-tone embroidery.",
                handle: "minimal-canvas-cap",
                is_giftcard: false,
                discountable: true,
                thumbnail:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
                options: [
                  {
                    title: "Color",
                    values: ["Navy", "Olive"],
                  },
                ],
                variants: [
                  {
                    title: "Navy",
                    sku: "CAP-NAVY",
                    options: { Color: "Navy" },
                    prices: [
                      { currency_code: "usd", amount: 2800 },
                      { currency_code: "eur", amount: 2500 },
                    ],
                  },
                ],
                sales_channels: defaultSalesChannelId ? [{ id: defaultSalesChannelId }] : undefined,
              },
            ],
          },
        })
        logger.info("✅ Sample products created successfully.")
      } else {
        logger.info(`ℹ️ Products already exist (${existingProducts.length} found). Skipping product creation.`)
      }
    } catch (prodErr: any) {
      logger.warn(`Notice while configuring products: ${prodErr.message}`)
    }

    // 4. Create Publishable API Key
    try {
      logger.info("🔑 Checking / Generating Publishable API Key...")
      const apiKeyService = container.resolve(Modules.API_KEY)
      const existingKeys = await apiKeyService.listApiKeys({ type: "publishable" })

      if (existingKeys.length === 0) {
        const { result: keyResult } = await createApiKeysWorkflow(container).run({
          input: {
            api_keys: [
              {
                title: "Storefront Publishable Key",
                type: "publishable",
                created_by: "system_seed",
              },
            ],
          },
        })
        const key = keyResult[0]
        logger.info(`✅ Generated Publishable API Key: ${key?.token || key?.id}`)
      } else {
        logger.info(`ℹ️ Publishable key found (${existingKeys[0]?.token || existingKeys[0]?.id})`)
      }
    } catch (keyErr: any) {
      logger.warn(`Notice while generating API key: ${keyErr.message}`)
    }

    logger.info("==================================================")
    logger.info("🎉 Medusa Seeding Completed Successfully!")
    logger.info("==================================================")
  } catch (err: any) {
    logger.error("Error during seed process: " + err.message)
    // Don't crash container on seed failure
  }
}
