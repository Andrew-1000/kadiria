import { asc, eq } from 'drizzle-orm'

/** Built-in fallback when the standards tables are empty (database not re-seeded yet). */
const FALLBACK = {
  key: 'smm_ea', code: 'SMM (East Africa)', name: 'Standard Method of Measurement of Building Works for East Africa', scope: 'building',
  edition: '', publisher: '', coverNote: 'Measured generally in accordance with the Standard Method of Measurement of Building Works for East Africa.'
}

export interface MeasurementInfo {
  key: string
  code: string
  name: string
  scope: 'building' | 'civil'
  edition: string
  publisher: string
  coverNote: string
  /** Section code → title, e.g. { F: 'Concrete work' } */
  sections: Record<string, string>
}

/** Active standards for pickers (BQ wizard, project settings). */
export async function listStandards() {
  const t = tables
  const rows = await useDb().select({ key: t.measurementStandards.key, code: t.measurementStandards.code, name: t.measurementStandards.name, scope: t.measurementStandards.scope, edition: t.measurementStandards.edition })
    .from(t.measurementStandards).where(eq(t.measurementStandards.active, true)).orderBy(asc(t.measurementStandards.sort))
  return rows.length ? rows : [{ key: FALLBACK.key, code: FALLBACK.code, name: FALLBACK.name, scope: FALLBACK.scope, edition: FALLBACK.edition }]
}

/** The standard a BQ is measured under, with its sections. */
export async function measurementFor(standardKey: string): Promise<MeasurementInfo> {
  const t = tables
  const db = useDb()
  const [std] = await db.select().from(t.measurementStandards).where(eq(t.measurementStandards.key, standardKey))
  const base = std ?? (await db.select().from(t.measurementStandards).orderBy(asc(t.measurementStandards.sort)).limit(1))[0] ?? FALLBACK
  const sections = base === FALLBACK
    ? []
    : await db.select({ code: t.measurementSections.code, title: t.measurementSections.title }).from(t.measurementSections).where(eq(t.measurementSections.standardKey, base.key)).orderBy(asc(t.measurementSections.sort))
  return {
    key: base.key, code: base.code, name: base.name, scope: base.scope === 'civil' ? 'civil' : 'building',
    edition: base.edition, publisher: base.publisher, coverNote: base.coverNote || `Measured in accordance with the ${base.name}.`,
    sections: Object.fromEntries(sections.map(s => [s.code, s.title]))
  }
}

/** Library code → section reference under the given scope (SMM for building, CESMM for civil). */
export async function libraryRefs(scope: 'building' | 'civil') {
  const t = tables
  const rows = await useDb().select({ code: t.libraryItems.code, smm: t.libraryItems.smmRef, cesmm: t.libraryItems.cesmmRef }).from(t.libraryItems)
  return new Map(rows.map(r => [r.code, scope === 'civil' ? r.cesmm : r.smm]))
}
