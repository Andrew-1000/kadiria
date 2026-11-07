import { z } from 'zod'

/** Current material prices for a location (falls back to national defaults). */
export default defineEventHandler(async (event) => {
  const { locationId } = parseQuery(event, z.object({ locationId: z.coerce.number().int().positive().optional() }))
  const prices = await getMaterialPrices(locationId ?? null)
  return [...prices.entries()].map(([key, p]) => ({ key, name: p.name, unit: p.unit, price: p.price, source: p.source }))
})
