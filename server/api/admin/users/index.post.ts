import { z } from 'zod'
import { sql } from 'drizzle-orm'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  organisation: z.string().trim().max(160).default(''),
  role: z.enum(['admin', 'professional', 'member']),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200)
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await parseBody(event, schema)
  const db = useDb()
  const [exists] = await db.select({ id: tables.users.id }).from(tables.users).where(sql`lower(${tables.users.email}) = lower(${body.email})`)
  if (exists) throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' })
  const { password, ...rest } = body
  const [user] = await db.insert(tables.users).values({ ...rest, passwordHash: await hashPassword(password) })
    .returning({ id: tables.users.id, email: tables.users.email, name: tables.users.name, role: tables.users.role })
  await audit(admin, 'User created', { email: body.email, role: body.role })
  return user
})
