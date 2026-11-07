import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const [bill] = await useDb().delete(tables.projectBills)
    .where(and(eq(tables.projectBills.id, getRouterParam(event, 'billId') ?? ''), eq(tables.projectBills.projectId, project.id))).returning()
  if (!bill) notFound('Bill')
  await touchProject(project.id)
  await audit(user, 'Bill removed', { title: bill.title }, project.id)
  return { ok: true }
})
