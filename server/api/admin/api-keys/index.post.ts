import { z } from 'zod'

const schema = z.object({ name: z.string().trim().min(2).max(120) })

/** Create a website integration key. The plain key is returned once only. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { name } = await parseBody(event, schema)
  const { key, prefix, keyHash } = newApiKey()
  const [row] = await useDb().insert(tables.apiKeys).values({ name, prefix, keyHash, createdBy: admin.id }).returning({ id: tables.apiKeys.id })
  await audit(admin, 'API key created', { name, prefix })
  return { id: row?.id, name, prefix, key }
})
