/** Feature switches, so the company website can decide which calculators to show. */
export default defineEventHandler(async () => {
  const [flags, modules] = await Promise.all([getFlags(), getModules(true)])
  return { flags, modules: Object.fromEntries(modules.map(m => [m.key, m.enabled])) }
})
