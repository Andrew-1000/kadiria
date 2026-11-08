import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'
import { connectionOptions } from '../db/connection'

export const tables = schema

let instance: PostgresJsDatabase<typeof schema> | null = null

export function useDb(): PostgresJsDatabase<typeof schema> {
  if (!instance) {
    const url = process.env.DATABASE_URL
    if (!url) throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL is not configured' })
    instance = drizzle(postgres(url, connectionOptions(url, 10)), { schema })
  }
  return instance
}

export type Db = PostgresJsDatabase<typeof schema>
