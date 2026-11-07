import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const name = getRouterParam(event, 'name')
  const def = getRefTable(name)
  const id = parsePk(def, getRouterParam(event, 'id'))
  const body = await parsePatch(event, def.create.partial()) as Record<string, unknown>
  for (const col of def.immutable ?? []) delete body[col]
  if (!Object.keys(body).length) throw createError({ statusCode: 400, statusMessage: 'Nothing to update.' })
  if ('updatedAt' in def.table) (body as Record<string, unknown>).updatedAt = new Date()
  try {
    const [row] = await useDb().update(def.table).set(body).where(eq(def.pk, id)).returning()
    if (!row) notFound()
    await audit(user, `${def.label}: updated`, { table: name, id, changes: body })
    return row
  }
  catch (e: unknown) {
    throw dbError(e)
  }
})
