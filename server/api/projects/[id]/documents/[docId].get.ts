import { and, eq } from 'drizzle-orm'

/** An immutable issued BQ snapshot. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user)
  const docId = getRouterParam(event, 'docId') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(docId)) notFound('Document')
  const [doc] = await useDb().select().from(tables.issuedDocuments)
    .where(and(eq(tables.issuedDocuments.id, docId), eq(tables.issuedDocuments.lineageId, project.lineageId)))
  if (!doc) notFound('Document')
  return doc
})
