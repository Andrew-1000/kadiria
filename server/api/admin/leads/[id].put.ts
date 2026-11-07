import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']) })

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('Request')
  const { status } = await parseBody(event, schema)
  const [row] = await useDb().update(tables.estimateRequests).set({ status }).where(eq(tables.estimateRequests.id, id)).returning()
  if (!row) notFound('Request')
  await audit(admin, 'Estimate request status changed', { name: row.name, status })
  return row
})
