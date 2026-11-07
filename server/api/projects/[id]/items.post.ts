import { eq, max } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parseBody(event, itemSchema)
  await assertBill(project.id, body.billId)
  const [agg] = await useDb().select({ s: max(tables.projectItems.sort) }).from(tables.projectItems).where(eq(tables.projectItems.billId, body.billId))
  const [item] = await useDb().insert(tables.projectItems).values({ ...body, projectId: project.id, source: 'manual', sort: (agg?.s ?? 0) + 1 }).returning()
  await touchProject(project.id)
  return item
})
