import { count, desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  const t = tables
  const [[users], [projects], [issued], [leads], [newLeads], [materials], flags, recent] = await Promise.all([
    db.select({ n: count() }).from(t.users),
    db.select({ n: count() }).from(t.projects),
    db.select({ n: count() }).from(t.issuedDocuments),
    db.select({ n: count() }).from(t.estimateRequests),
    db.select({ n: count() }).from(t.estimateRequests).where(eq(t.estimateRequests.status, 'new')),
    db.select({ n: count() }).from(t.materials),
    db.select().from(t.featureFlags).orderBy(t.featureFlags.sort),
    db.select().from(t.auditEvents).orderBy(desc(t.auditEvents.at)).limit(8)
  ])
  return {
    counts: { users: users?.n ?? 0, projects: projects?.n ?? 0, issued: issued?.n ?? 0, leads: leads?.n ?? 0, newLeads: newLeads?.n ?? 0, materials: materials?.n ?? 0 },
    flags, recent
  }
})
