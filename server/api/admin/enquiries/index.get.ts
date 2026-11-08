import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return useDb().select().from(tables.siteEnquiries).orderBy(desc(tables.siteEnquiries.createdAt)).limit(1000)
})
