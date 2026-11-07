import { z } from 'zod'
import { sql } from 'drizzle-orm'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email().max(160),
  organisation: z.string().trim().max(160).default(''),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200)
})

export default defineEventHandler(async (event) => {
  await requireFeature('public_registration')
  const body = await parseBody(event, schema)
  const db = useDb()
  const [exists] = await db.select({ id: tables.users.id }).from(tables.users).where(sql`lower(${tables.users.email}) = lower(${body.email})`)
  if (exists) throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists.' })
  const [user] = await db.insert(tables.users).values({
    name: body.name, email: body.email, organisation: body.organisation, role: 'member', passwordHash: await hashPassword(body.password)
  }).returning()
  if (!user) throw createError({ statusCode: 500, statusMessage: 'Could not create account.' })
  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
  await setUserSession(event, { user: sessionUser, loggedInAt: Date.now() })
  await audit(sessionUser, 'Account registered')
  return { user: sessionUser }
})
