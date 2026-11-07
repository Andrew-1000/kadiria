import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return useDb().select().from(tables.estimateRequests).orderBy(desc(tables.estimateRequests.createdAt)).limit(500)
})
