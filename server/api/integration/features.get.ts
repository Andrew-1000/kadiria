import { asc } from 'drizzle-orm'

/** Website integration: list feature switches and module switches (API key required). */
export default defineEventHandler(async (event) => {
  await requireApiKey(event)
  const [flags, modules] = await Promise.all([
    useDb().select().from(tables.featureFlags).orderBy(asc(tables.featureFlags.sort)),
    getModules(true)
  ])
  return {
    flags: flags.map(f => ({ key: f.key, label: f.label, description: f.description, category: f.category, enabled: f.enabled })),
    modules: modules.map(m => ({ key: m.key, name: m.name, enabled: m.enabled }))
  }
})
