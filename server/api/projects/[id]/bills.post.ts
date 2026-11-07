import { eq, max } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parseBody(event, billSchema)
  const [agg] = await useDb().select({ n: max(tables.projectBills.number), s: max(tables.projectBills.sort) }).from(tables.projectBills).where(eq(tables.projectBills.projectId, project.id))
  const [bill] = await useDb().insert(tables.projectBills).values({
    projectId: project.id, title: body.title, notes: body.notes, provisional: body.provisional,
    number: body.number ?? (agg?.n ?? 0) + 1, sort: (agg?.s ?? 0) + 1
  }).returning()
  await touchProject(project.id)
  await audit(user, 'Bill added', { title: body.title }, project.id)
  return bill
})
