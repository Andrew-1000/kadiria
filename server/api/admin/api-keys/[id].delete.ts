import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('API key')
  const [row] = await useDb().update(tables.apiKeys).set({ revokedAt: new Date() }).where(eq(tables.apiKeys.id, id)).returning()
  if (!row) notFound('API key')
  await audit(admin, 'API key revoked', { name: row.name, prefix: row.prefix })
  return { ok: true }
})
