import { desc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const t = tables
  const amount = sql<number>`coalesce(sum(${t.projectItems.quantity} * ${t.projectItems.rate}), 0)::float8`
  const rows = await useDb()
    .select({
      id: t.projects.id, name: t.projects.name, client: t.projects.client, status: t.projects.status, revision: t.projects.revision,
      currency: t.projects.currency, updatedAt: t.projects.updatedAt, createdAt: t.projects.createdAt, ownerId: t.projects.ownerId,
      locationName: t.locations.name, ownerName: t.users.name,
      contingencyPercent: t.projects.contingencyPercent, vatPercent: t.projects.vatPercent,
      subtotal: amount, itemCount: sql<number>`count(${t.projectItems.id})::int`
    })
    .from(t.projects)
    .leftJoin(t.locations, eq(t.locations.id, t.projects.locationId))
    .leftJoin(t.users, eq(t.users.id, t.projects.ownerId))
    .leftJoin(t.projectItems, eq(t.projectItems.projectId, t.projects.id))
    .where(user.role === 'admin' ? undefined : eq(t.projects.ownerId, user.id))
    .groupBy(t.projects.id, t.locations.name, t.users.name)
    .orderBy(desc(t.projects.updatedAt))
  return rows.map(r => {
    const subtotal = Math.round(r.subtotal * 100) / 100
    const beforeVat = subtotal * (1 + r.contingencyPercent / 100)
    return { ...r, subtotal, grandTotal: Math.round(beforeVat * (1 + r.vatPercent / 100) * 100) / 100 }
  })
})
