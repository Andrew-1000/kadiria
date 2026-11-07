import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { MODULE_MAP } from '#shared/calc/modules'

const schema = z.object({ enabled: z.boolean() })

/**
 * Website integration: switch a feature (e.g. cost_estimator) or a single module
 * (prefix "module:", e.g. module:blinding) on or off. API key required.
 */
export default defineEventHandler(async (event) => {
  const apiKey = await requireApiKey(event)
  const key = decodeURIComponent(getRouterParam(event, 'key') ?? '')
  const { enabled } = await parseBody(event, schema)
  const db = useDb()
  if (key.startsWith('module:')) {
    const moduleKey = key.slice(7)
    if (!MODULE_MAP[moduleKey]) notFound('Module')
    await db.insert(tables.calcModules).values({ key: moduleKey, enabled })
      .onConflictDoUpdate({ target: tables.calcModules.key, set: { enabled, updatedAt: new Date() } })
  }
  else {
    const [row] = await db.update(tables.featureFlags).set({ enabled, updatedAt: new Date() }).where(eq(tables.featureFlags.key, key)).returning()
    if (!row) notFound('Feature')
  }
  clearOriginCache()
  await audit(null, 'Feature switched via website integration', { key, enabled, apiKey: apiKey.prefix })
  return { key, enabled }
})
