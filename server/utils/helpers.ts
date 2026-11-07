import type { H3Event } from 'h3'
import type { z } from 'zod'

export type Role = 'admin' | 'professional' | 'member'

export interface SessionUser { id: string, name: string, email: string, role: Role }

/** Parse a JSON body with a zod schema; responds 400 with the first readable issue. */
export async function parseBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const body = await readBody(event).catch(() => undefined)
  const result = schema.safeParse(body ?? {})
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path?.length ? `${issue.path.join('.')}: ` : ''
    throw createError({ statusCode: 400, statusMessage: `${path}${issue?.message ?? 'Invalid request'}` })
  }
  return result.data
}

/**
 * Parse a PATCH-style body: validates with the (partial) schema but returns only the keys the
 * client actually sent, because zod applies `.default()` values even inside `.partial()`.
 */
export async function parsePatch<T extends z.ZodType>(event: H3Event, schema: T): Promise<Partial<z.infer<T>>> {
  const raw = await readBody(event).catch(() => undefined)
  const parsed = await parseBody(event, schema) as Record<string, unknown>
  const sent = new Set(Object.keys(raw && typeof raw === 'object' ? raw : {}))
  const out = Object.fromEntries(Object.entries(parsed).filter(([k]) => sent.has(k)))
  if (!Object.keys(out).length) throw createError({ statusCode: 400, statusMessage: 'Nothing to update.' })
  return out as Partial<z.infer<T>>
}

export function parseQuery<T extends z.ZodType>(event: H3Event, schema: T): z.infer<T> {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? 'Invalid query' })
  return result.data
}

export async function requireUser(event: H3Event, roles?: Role[]): Promise<SessionUser> {
  const session = await requireUserSession(event)
  const user = session.user as unknown as SessionUser
  if (roles && !roles.includes(user.role)) throw createError({ statusCode: 403, statusMessage: 'You do not have permission to do this.' })
  return user
}

export const requireAdmin = (event: H3Event) => requireUser(event, ['admin'])

export async function audit(actor: SessionUser | null, action: string, details: Record<string, unknown> = {}, projectId: string | null = null) {
  await useDb().insert(tables.auditEvents).values({ actorId: actor?.id ?? null, actorName: actor?.name ?? null, action, details, projectId })
}

export function notFound(what = 'Record'): never {
  throw createError({ statusCode: 404, statusMessage: `${what} not found.` })
}

/** Translate Postgres constraint errors into readable 409/400 responses. */
export function dbError(e: unknown) {
  if (e && typeof e === 'object' && 'statusCode' in e) return e
  const cause = (e as { cause?: { code?: string, detail?: string } })?.cause ?? (e as { code?: string, detail?: string })
  if (cause?.code === '23505') return createError({ statusCode: 409, statusMessage: `Already exists. ${cause.detail ?? ''}`.trim() })
  if (cause?.code === '23503') return createError({ statusCode: 409, statusMessage: 'This record is referenced by other data (or references a missing record).' })
  return e
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
