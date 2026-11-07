import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'

/** Current national prices for all materials, or the price history of one material. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { materialId, locationId } = parseQuery(event, z.object({
    materialId: z.coerce.number().int().positive().optional(),
    locationId: z.coerce.number().int().positive().optional()
  }))
  if (materialId) {
    return useDb().select({
      id: tables.materialPrices.id, price: tables.materialPrices.price, effectiveFrom: tables.materialPrices.effectiveFrom,
      source: tables.materialPrices.source, recordedAt: tables.materialPrices.recordedAt, locationId: tables.materialPrices.locationId,
      locationName: tables.locations.name
    }).from(tables.materialPrices)
      .leftJoin(tables.locations, eq(tables.locations.id, tables.materialPrices.locationId))
      .where(eq(tables.materialPrices.materialId, materialId))
      .orderBy(desc(tables.materialPrices.effectiveFrom), desc(tables.materialPrices.recordedAt))
  }
  const prices = await getMaterialPrices(locationId ?? null)
  return Object.fromEntries([...prices.entries()].map(([key, p]) => [key, { price: p.price, source: p.source }]))
})
