import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'

/** One standard with all its sections and measurement rules (public reference page). */
export default defineEventHandler(async (event) => {
  const key = z.string().regex(/^[a-z0-9_]{1,60}$/).parse(getRouterParam(event, 'key'))
  const t = tables
  const db = useDb()
  const [standard] = await db.select().from(t.measurementStandards).where(and(eq(t.measurementStandards.key, key), eq(t.measurementStandards.active, true)))
  if (!standard) throw createError({ statusCode: 404, statusMessage: 'Standard not found.' })
  const [sections, rules] = await Promise.all([
    db.select({ code: t.measurementSections.code, title: t.measurementSections.title, guidance: t.measurementSections.guidance }).from(t.measurementSections).where(eq(t.measurementSections.standardKey, key)).orderBy(asc(t.measurementSections.sort)),
    db.select({ sectionCode: t.measurementRules.sectionCode, ref: t.measurementRules.ref, item: t.measurementRules.item, unit: t.measurementRules.unit, rule: t.measurementRules.rule, source: t.measurementRules.source })
      .from(t.measurementRules).where(eq(t.measurementRules.standardKey, key)).orderBy(asc(t.measurementRules.sort))
  ])
  return { standard, sections, rules }
})
