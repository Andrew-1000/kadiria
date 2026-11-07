import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const def = getRefTable(getRouterParam(event, 'name'))
  return useDb().select().from(def.table).orderBy(...def.orderBy.map(c => asc(c)))
})
