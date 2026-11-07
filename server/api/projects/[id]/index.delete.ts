import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user)
  if (project.status === 'issued') throw createError({ statusCode: 409, statusMessage: 'Issued BQs are kept for the record and cannot be deleted.' })
  const [doc] = await useDb().select({ id: tables.issuedDocuments.id }).from(tables.issuedDocuments).where(eq(tables.issuedDocuments.projectId, project.id)).limit(1)
  if (doc) throw createError({ statusCode: 409, statusMessage: 'This project has issued documents and cannot be deleted.' })
  await useDb().delete(tables.projects).where(eq(tables.projects.id, project.id))
  await audit(user, 'Project deleted', { name: project.name }, project.id)
  return { ok: true }
})
