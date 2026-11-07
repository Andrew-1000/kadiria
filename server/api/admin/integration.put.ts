import { z } from 'zod'

const origin = z.string().trim().regex(/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i, 'Origins look like https://www.example.co.ke (no path)')
const schema = z.object({ origins: z.array(origin).max(50) })

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { origins } = await parseBody(event, schema)
  const value = [...new Set(origins.map(o => o.toLowerCase().replace(/\/$/, '')))]
  await useDb().insert(tables.settings).values({ key: 'embed_allowed_origins', value })
    .onConflictDoUpdate({ target: tables.settings.key, set: { value, updatedAt: new Date() } })
  clearOriginCache()
  await audit(admin, 'Embed origins updated', { origins: value })
  return { origins: value }
})
