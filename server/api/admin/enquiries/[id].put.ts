import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']) })

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('Enquiry')
  const { status } = await parseBody(event, schema)
  const [row] = await useDb().update(tables.siteEnquiries).set({ status }).where(eq(tables.siteEnquiries.id, id)).returning()
  if (!row) notFound('Enquiry')
  await audit(admin, 'Website enquiry status changed', { name: row.name, site: row.site, status })
  return row
})
