import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const k = tables.apiKeys
  const [origins, issuer, keys] = await Promise.all([
    getSetting<string[]>('embed_allowed_origins', []),
    getSetting<string>('document_issuer', ''),
    useDb().select({ id: k.id, name: k.name, prefix: k.prefix, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt, revokedAt: k.revokedAt }).from(k).orderBy(desc(k.createdAt))
  ])
  return { origins, issuer: typeof issuer === 'string' ? issuer : '', keys }
})
