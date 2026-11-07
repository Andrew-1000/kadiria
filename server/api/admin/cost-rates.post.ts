import { z } from 'zod'

const schema = z.object({
  tierId: z.coerce.number().int().positive(),
  finishKey: z.string().min(1),
  minRate: z.coerce.number().positive().max(1e8),
  maxRate: z.coerce.number().positive().max(1e8),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(300).default('')
}).refine(v => v.maxRate >= v.minRate, { message: 'Maximum rate must be at least the minimum rate.' })

/** Record a new cost-per-m² band. History is retained; the latest effective band applies. */
export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await parseBody(event, schema)
  try {
    const [row] = await useDb().insert(tables.costRates).values(body).returning()
    await audit(user, 'Cost per m² rate recorded', body)
    return row
  }
  catch (e) { throw dbError(e) }
})
