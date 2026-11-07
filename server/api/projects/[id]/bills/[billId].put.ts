import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parsePatch(event, billSchema.partial())
  const [bill] = await useDb().update(tables.projectBills).set(body)
    .where(and(eq(tables.projectBills.id, getRouterParam(event, 'billId') ?? ''), eq(tables.projectBills.projectId, project.id))).returning()
  if (!bill) notFound('Bill')
  await touchProject(project.id)
  return bill
})
