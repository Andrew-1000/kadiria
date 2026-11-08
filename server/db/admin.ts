// Create an administrator, or reset an existing account's password and make it an active admin.
// Usage (PowerShell), with DATABASE_URL pointing at the database (e.g. the Supabase session pooler):
//   $env:ADMIN_EMAIL = "you@example.com"; $env:ADMIN_PASSWORD = "new password"; npm run db:admin
// Or put DATABASE_URL / ADMIN_EMAIL / ADMIN_PASSWORD in a git-ignored file and run:
//   $env:DOTENV_CONFIG_PATH = ".env.supabase"; npm run db:admin
import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as s from './schema'
import { connectionOptions } from './connection'
import { hashPassword } from './password'

const url = process.env.DATABASE_URL
const email = (process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || '').trim()
const password = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || ''
if (!url) throw new Error('DATABASE_URL is not set.')
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Set ADMIN_EMAIL to the admin\'s email address.')
if (password.length < 8) throw new Error('Set ADMIN_PASSWORD (at least 8 characters).')

const client = postgres(url, connectionOptions(url, 1))
const db = drizzle(client, { schema: s })
try {
  const passwordHash = await hashPassword(password)
  const [existing] = await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = lower(${email})`)
  if (existing) {
    await db.update(s.users).set({ passwordHash, role: 'admin', active: true, updatedAt: new Date() }).where(sql`${s.users.id} = ${existing.id}`)
    console.log(`✔ Password reset; ${email} is an active administrator.`)
  }
  else {
    await db.insert(s.users).values({ email, name: 'Administrator', role: 'admin', passwordHash })
    console.log(`✔ Administrator created: ${email}`)
  }
}
finally {
  await client.end()
}
