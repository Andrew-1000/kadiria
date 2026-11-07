import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const name = getRouterParam(event, 'name')
  const def = getRefTable(name)
  if (def.allowCreateDelete === false) throw createError({ statusCode: 405, statusMessage: `${def.label} cannot be deleted.` })
  const id = parsePk(def, getRouterParam(event, 'id'))
  try {
    const [row] = await useDb().delete(def.table).where(eq(def.pk, id)).returning()
    if (!row) notFound()
    await audit(user, `${def.label}: deleted`, { table: name, id })
    return { ok: true }
  }
  catch (e: unknown) {
    throw dbError(e)
  }
})
