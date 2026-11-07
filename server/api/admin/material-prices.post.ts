import { z } from 'zod'

const schema = z.object({
  materialId: z.coerce.number().int().positive(),
  locationId: z.coerce.number().int().positive().nullable().default(null),
  price: z.coerce.number().min(0).max(1e8),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().max(300).default('')
})

/** Record a new effective-dated material price (national when locationId is null). */
export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await parseBody(event, schema)
  try {
    const [row] = await useDb().insert(tables.materialPrices).values(body).returning()
    await audit(user, 'Material price recorded', body)
    return row
  }
  catch (e) { throw dbError(e) }
})
