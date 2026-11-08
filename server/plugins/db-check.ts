import { sql } from 'drizzle-orm'

/**
 * On startup, check the database once and print a clear, actionable message instead of
 * letting every request fail with a bare "Failed query" error. Also explains DB errors in
 * later request logs.
 */
export default defineNitroPlugin((nitroApp) => {
  const banner = (msg: string) => console.error(`\n  ✖ Kadiria cannot use the database:\n    ${msg}\n    (see README → Getting started)\n`)

  setTimeout(async () => {
    try {
      await useDb().execute(sql`select 1 from feature_flags limit 1`)
      console.log('  ✔ Database connection OK')
    }
    catch (e) {
      banner(explainDbError(e) ?? String((e as Error)?.message ?? e))
    }
  }, 0)

  let lastHint = ''
  nitroApp.hooks.hook('error', (error) => {
    const hint = explainDbError(error)
    if (hint && hint !== lastHint) {
      lastHint = hint
      banner(hint)
    }
  })
})
