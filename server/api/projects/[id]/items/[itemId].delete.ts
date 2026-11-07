import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const [item] = await useDb().delete(tables.projectItems)
    .where(and(eq(tables.projectItems.id, getRouterParam(event, 'itemId') ?? ''), eq(tables.projectItems.projectId, project.id))).returning()
  if (!item) notFound('Item')
  await touchProject(project.id)
  return { ok: true }
})
