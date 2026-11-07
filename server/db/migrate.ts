import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env).')
const client = postgres(url, { max: 1, onnotice: () => {} })
await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) })
console.log('✔ Migrations applied')
await client.end()
