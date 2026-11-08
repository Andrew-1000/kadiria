import { z } from 'zod'

/** Measurement rules for one section of a standard, e.g. /api/standards/aaqs_2015/rules?section=07 */
export default defineEventHandler(async (event) => {
  const key = z.string().regex(/^[a-z0-9_]{1,60}$/).parse(getRouterParam(event, 'key'))
  const section = z.string().regex(/^[A-Z0-9.]{1,8}$/).parse(getQuery(event).section)
  return sectionRules(key, section)
})
