import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) })

export default defineEventHandler(async (event) => {
  assertSessionConfigured()
  const { email, password } = await parseBody(event, schema)
  const db = useDb()
  const [user] = await db.select().from(tables.users).where(sql`lower(${tables.users.email}) = lower(${email})`)
  const ok = user && user.active && await verifyPassword(user.passwordHash, password)
  if (!ok || !user) throw createError({ statusCode: 401, statusMessage: 'Incorrect email or password.' })
  await db.update(tables.users).set({ lastLoginAt: new Date() }).where(eq(tables.users.id, user.id))
  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
  await setUserSession(event, { user: sessionUser, loggedInAt: Date.now() })
  return { user: sessionUser }
})
