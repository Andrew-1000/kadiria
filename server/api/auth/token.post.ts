import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) })

/**
 * Website sign-in: returns a bearer token for the static company websites (GitHub Pages),
 * which cannot share this app's session cookie. Same accounts as the BQ system.
 */
export default defineEventHandler(async (event) => {
  const { email, password } = await parseBody(event, schema)
  const db = useDb()
  const [user] = await db.select().from(tables.users).where(sql`lower(${tables.users.email}) = lower(${email})`)
  const ok = user && user.active && await verifyPassword(user.passwordHash, password)
  if (!ok || !user) throw createError({ statusCode: 401, statusMessage: 'Incorrect email or password.' })
  await db.update(tables.users).set({ lastLoginAt: new Date() }).where(eq(tables.users.id, user.id))
  const { token, expiresAt } = await issueToken(user.id)
  await audit({ id: user.id, name: user.name, email: user.email, role: user.role }, 'Signed in from a website', { origin: getHeader(event, 'origin') ?? '' })
  return { token, expiresAt, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
})
