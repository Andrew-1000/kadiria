import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'

export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')

export function newApiKey() {
  const key = `kdr_${randomBytes(24).toString('base64url')}`
  return { key, prefix: key.slice(0, 10), keyHash: hashKey(key) }
}

/** Authenticate a server-to-server call from the company website (Authorization: Bearer kdr_...). */
export async function requireApiKey(event: H3Event) {
  const header = getHeader(event, 'authorization') ?? ''
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!key.startsWith('kdr_') && !key.startsWith('dvk_')) throw createError({ statusCode: 401, statusMessage: 'API key required.' })
  const db = useDb()
  const [row] = await db.select().from(tables.apiKeys).where(and(eq(tables.apiKeys.keyHash, hashKey(key)), isNull(tables.apiKeys.revokedAt)))
  if (!row) throw createError({ statusCode: 401, statusMessage: 'Invalid or revoked API key.' })
  await db.update(tables.apiKeys).set({ lastUsedAt: new Date() }).where(eq(tables.apiKeys.id, row.id))
  return row
}

let originCache: { at: number, origins: string[], embed: boolean } | null = null

/** Origins allowed to frame /embed pages and call the public API from a browser (cached 30 s). */
export async function allowedOrigins() {
  if (originCache && Date.now() - originCache.at < 30_000) return originCache
  try {
    const [origins, flags] = await Promise.all([getSetting<string[]>('embed_allowed_origins', []), getFlags()])
    originCache = { at: Date.now(), origins: Array.isArray(origins) ? origins : [], embed: flags.embed !== false }
  }
  catch {
    originCache = { at: Date.now(), origins: [], embed: false }
  }
  return originCache
}

export function clearOriginCache() {
  originCache = null
}
