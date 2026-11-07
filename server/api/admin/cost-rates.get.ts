import { desc } from 'drizzle-orm'

/** Current bands plus full effective-dated history. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [current, history] = await Promise.all([
    getCurrentCostRates(),
    useDb().select().from(tables.costRates).orderBy(desc(tables.costRates.effectiveFrom), desc(tables.costRates.recordedAt)).limit(500)
  ])
  return { current, history }
})
