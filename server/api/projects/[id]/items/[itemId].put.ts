import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parsePatch(event, itemUpdateSchema)
  if (body.billId) await assertBill(project.id, body.billId)
  const [item] = await useDb().update(tables.projectItems).set(body)
    .where(and(eq(tables.projectItems.id, getRouterParam(event, 'itemId') ?? ''), eq(tables.projectItems.projectId, project.id))).returning()
  if (!item) notFound('Item')
  await touchProject(project.id)
  return item
})
