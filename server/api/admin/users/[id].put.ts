import { z } from 'zod'
import { eq } from 'drizzle-orm'

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  organisation: z.string().trim().max(160).optional(),
  role: z.enum(['admin', 'professional', 'member']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200).optional()
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('User')
  const body = await parseBody(event, schema)
  if (id === admin.id && (body.role && body.role !== 'admin' || body.active === false)) {
    throw createError({ statusCode: 409, statusMessage: 'You cannot remove your own administrator access.' })
  }
  const { password, ...rest } = body
  const [user] = await useDb().update(tables.users)
    .set({ ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}), updatedAt: new Date() })
    .where(eq(tables.users.id, id))
    .returning({ id: tables.users.id, email: tables.users.email, role: tables.users.role, active: tables.users.active })
  if (!user) notFound('User')
  await audit(admin, 'User updated', { email: user.email, changes: { ...rest, password: password ? '(reset)' : undefined } })
  return user
})
