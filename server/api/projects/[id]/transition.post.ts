import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { eq, max } from 'drizzle-orm'

const schema = z.object({ action: z.enum(['submit', 'return', 'approve', 'issue', 'revise']) })

/**
 * Workflow: draft → submitted → approved → issued; "return" sends a submitted BQ back to draft,
 * "revise" copies an issued BQ into a new draft revision (issued snapshots stay immutable).
 * Approval and issue need a professional or admin.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user)
  const { action } = await parseBody(event, schema)
  const db = useDb()
  const reviewer = user.role === 'admin' || user.role === 'professional'
  const conflict = (msg: string) => { throw createError({ statusCode: 409, statusMessage: msg }) }
  const setStatus = (status: 'draft' | 'submitted' | 'approved' | 'issued') =>
    db.update(tables.projects).set({ status, updatedAt: new Date() }).where(eq(tables.projects.id, project.id))

  if (action === 'submit') {
    if (project.status !== 'draft') conflict('Only draft BQs can be submitted for review.')
    const detail = await projectDetail(project)
    if (!detail.bills.some(b => b.items.length)) conflict('Add at least one item before submitting.')
    await setStatus('submitted')
  }
  else if (action === 'return') {
    if (project.status !== 'submitted' && project.status !== 'approved') conflict('Only BQs in review can be returned to draft.')
    if (!reviewer && project.ownerId !== user.id) conflict('Not allowed.')
    await setStatus('draft')
  }
  else if (action === 'approve') {
    if (!reviewer) throw createError({ statusCode: 403, statusMessage: 'Only a professional or administrator can approve a BQ.' })
    if (project.status !== 'submitted') conflict('Only submitted BQs can be approved.')
    await setStatus('approved')
  }
  else if (action === 'issue') {
    if (!reviewer) throw createError({ statusCode: 403, statusMessage: 'Only a professional or administrator can issue a BQ.' })
    if (project.status !== 'approved') conflict('Only approved BQs can be issued.')
    const detail = await projectDetail(project)
    await db.transaction(async (tx) => {
      await tx.insert(tables.issuedDocuments).values({
        projectId: project.id, lineageId: project.lineageId, revision: project.revision, issuedBy: user.id,
        snapshot: { ...detail, documents: undefined, issuedByName: user.name }, grandTotal: detail.summary.grandTotal
      })
      await tx.update(tables.projects).set({ status: 'issued', updatedAt: new Date() }).where(eq(tables.projects.id, project.id))
    })
  }
  else if (action === 'revise') {
    if (project.status !== 'issued') conflict('A new revision can only be created from an issued BQ.')
    const [agg] = await db.select({ r: max(tables.projects.revision) }).from(tables.projects).where(eq(tables.projects.lineageId, project.lineageId))
    const newId = randomUUID()
    const detail = await projectDetail(project)
    await db.transaction(async (tx) => {
      const { id: _id, createdAt: _c, updatedAt: _u, ...copy } = project
      await tx.insert(tables.projects).values({ ...copy, id: newId, status: 'draft', revision: (agg?.r ?? project.revision) + 1, previousProjectId: project.id, ownerId: project.ownerId })
      for (const bill of detail.bills) {
        const { id: _b, items, projectId: _p, description: _d, ...billCopy } = bill
        const [nb] = await tx.insert(tables.projectBills).values({ ...billCopy, projectId: newId }).returning()
        if (items.length && nb) {
          await tx.insert(tables.projectItems).values(items.map(({ id: _i, createdAt: _ic, billId: _bi, projectId: _pi, measureRef: _m, ...item }) => ({ ...item, billId: nb.id, projectId: newId })))
        }
      }
    })
    await audit(user, 'Draft revision created', { from: project.revision }, newId)
    return { id: newId }
  }
  await audit(user, `BQ ${action}`, { revision: project.revision }, project.id)
  return { id: project.id }
})
