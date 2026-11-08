import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { connectionOptions, normaliseDatabaseUrl } from './connection'

const url = process.env.DATABASE_URL ? normaliseDatabaseUrl(process.env.DATABASE_URL) : undefined
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env).')
const client = postgres(url, connectionOptions(url, 1))
await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)) })
console.log('✔ Migrations applied')
await client.end()
