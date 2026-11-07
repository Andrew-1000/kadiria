import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const u = tables.users
  return useDb().select({
    id: u.id, email: u.email, name: u.name, role: u.role, organisation: u.organisation, active: u.active, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt
  }).from(u).orderBy(asc(u.name))
})
