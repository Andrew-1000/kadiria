export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const name = getRouterParam(event, 'name')
  const def = getRefTable(name)
  if (def.allowCreateDelete === false) throw createError({ statusCode: 405, statusMessage: `${def.label} are defined by the system and cannot be added here.` })
  const body = await parseBody(event, def.create)
  try {
    const [row] = await useDb().insert(def.table).values(body).returning()
    await audit(user, `${def.label}: created`, { table: name, row: body })
    return row
  }
  catch (e: unknown) {
    throw dbError(e)
  }
})
