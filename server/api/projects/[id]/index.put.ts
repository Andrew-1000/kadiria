import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parsePatch(event, projectUpdateSchema)
  const { params, ...rest } = body
  await useDb().update(tables.projects).set({
    ...rest,
    ...(params ? { params: normaliseParams(params) as unknown as Record<string, unknown> } : {}),
    updatedAt: new Date()
  }).where(eq(tables.projects.id, project.id))
  await audit(user, 'Project details updated', { fields: Object.keys(body) }, project.id)
  const [fresh] = await useDb().select().from(tables.projects).where(eq(tables.projects.id, project.id))
  return projectDetail(fresh!)
})
