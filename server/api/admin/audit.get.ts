import { z } from 'zod'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { limit } = parseQuery(event, z.object({ limit: z.coerce.number().int().min(1).max(1000).default(200) }))
  return useDb().select().from(tables.auditEvents).orderBy(desc(tables.auditEvents.at)).limit(limit)
})
