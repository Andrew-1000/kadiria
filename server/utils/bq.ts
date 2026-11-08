import { asc, eq, and } from 'drizzle-orm'
import { bqSummary, computeDrivers, DEFAULT_PARAMS, PREREQUISITES, readiness, type ProjectParams } from '#shared/calc/bq'

const t = tables

export type ProjectRow = typeof tables.projects.$inferSelect

/** Load a project the user may access (owner or admin). */
export async function loadProject(id: string, user: SessionUser, opts: { editable?: boolean } = {}): Promise<ProjectRow> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('Project')
  const [project] = await useDb().select().from(t.projects).where(eq(t.projects.id, id))
  if (!project) notFound('Project')
  if (project.ownerId !== user.id && user.role !== 'admin') notFound('Project')
  if (opts.editable && project.status !== 'draft') {
    throw createError({ statusCode: 409, statusMessage: 'Only draft BQs can be edited. Create a new revision to make changes.' })
  }
  return project
}

export async function projectDetail(project: ProjectRow) {
  const db = useDb()
  const [bills, items, location, docs, templates] = await Promise.all([
    db.select().from(t.projectBills).where(eq(t.projectBills.projectId, project.id)).orderBy(asc(t.projectBills.sort), asc(t.projectBills.number)),
    db.select().from(t.projectItems).where(eq(t.projectItems.projectId, project.id)).orderBy(asc(t.projectItems.sort), asc(t.projectItems.createdAt)),
    project.locationId ? db.select().from(t.locations).where(eq(t.locations.id, project.locationId)).then(r => r[0] ?? null) : Promise.resolve(null),
    db.select({ id: t.issuedDocuments.id, revision: t.issuedDocuments.revision, issuedAt: t.issuedDocuments.issuedAt, grandTotal: t.issuedDocuments.grandTotal, projectId: t.issuedDocuments.projectId })
      .from(t.issuedDocuments).where(eq(t.issuedDocuments.lineageId, project.lineageId)).orderBy(asc(t.issuedDocuments.revision)),
    db.select({ key: t.billTemplates.key, description: t.billTemplates.description }).from(t.billTemplates)
  ])
  const describe = new Map(templates.map(tpl => [tpl.key, tpl.description]))
  // Method of measurement: each library-based item carries its section of the chosen standard
  const measurement = await measurementFor(project.measurementStandard)
  const refs = await libraryRefs(measurement.key)
  const withRef = (i: typeof items[number]) => {
    const code = (i.libraryCode && refs.get(i.libraryCode)) || ''
    return { ...i, measureRef: code ? { code, title: measurement.sections[code] ?? '' } : null }
  }
  const billsWithItems = bills.map(b => ({ ...b, description: (b.templateKey && describe.get(b.templateKey)) || '', items: items.filter(i => i.billId === b.id).map(withRef) }))
  const summary = bqSummary(billsWithItems, project.contingencyPercent, project.vatPercent)
  return { ...project, location, measurement, bills: billsWithItems, summary, readiness: readiness(project.prerequisites), documents: docs }
}

/** A library item applies to a construction method when its method list is empty or includes it. */
export function appliesTo(methods: string, method: string) {
  const list = methods.split(',').map(x => x.trim()).filter(Boolean)
  return !list.length || list.includes(method || 'masonry')
}

export async function assertBill(projectId: string, billId: string) {
  const [bill] = await useDb().select({ id: t.projectBills.id }).from(t.projectBills)
    .where(and(eq(t.projectBills.id, billId), eq(t.projectBills.projectId, projectId)))
  if (!bill) notFound('Bill')
}

export async function touchProject(id: string) {
  await useDb().update(t.projects).set({ updatedAt: new Date() }).where(eq(t.projects.id, id))
}

/**
 * Rate factors for a location and finish relative to the library baseline (Nairobi, standard finish):
 *   location = mid(tier, standard) / mid(base tier, standard) × (1 + location adjustment)
 *   finish   = mid(tier, finish) / mid(tier, standard)
 */
export async function rateFactors(locationId: number | null, finishKey: string | null) {
  const db = useDb()
  const rates = await getCurrentCostRates()
  const mid = (tierId: number | undefined, finish: string) => {
    const r = rates.find(x => x.tierId === tierId && x.finishKey === finish)
    return r ? (r.minRate + r.maxRate) / 2 : null
  }
  const [loc] = locationId ? await db.select().from(t.locations).where(eq(t.locations.id, locationId)) : []
  const tier = loc ? (await db.select().from(t.rateTiers).where(eq(t.rateTiers.id, loc.tierId)))[0] : undefined
  const [baseTier] = await db.select().from(t.rateTiers)
    .where(tier ? eq(t.rateTiers.countryCode, tier.countryCode) : undefined)
    .orderBy(asc(t.rateTiers.sort)).limit(1)
  const baseMid = mid(baseTier?.id, 'standard')
  const tierMid = mid(tier?.id ?? baseTier?.id, 'standard')
  const finishMid = mid(tier?.id ?? baseTier?.id, finishKey ?? 'standard')
  const location = baseMid && tierMid ? (tierMid / baseMid) * (1 + (loc?.adjustmentPercent ?? 0) / 100) : 1
  const finish = tierMid && finishMid ? finishMid / tierMid : 1
  return { location: Math.round(location * 1000) / 1000, finish: Math.round(finish * 1000) / 1000 }
}

export function normaliseParams(raw: Partial<ProjectParams> | undefined): ProjectParams {
  const p = { ...DEFAULT_PARAMS, ...(raw ?? {}) }
  p.floorAreas = (p.floorAreas ?? []).map(Number).filter(n => Number.isFinite(n) && n >= 0)
  if (!p.floorAreas.length) p.floorAreas = [...DEFAULT_PARAMS.floorAreas]
  return p
}

/** Price a library item for a project. */
export function libraryLine(lib: typeof tables.libraryItems.$inferSelect, drivers: Record<string, number>, f: { location: number, finish: number }) {
  const factor = f.location * (lib.finishSensitive ? f.finish : 1)
  const driverValue = drivers[lib.driver] ?? 0
  if (lib.itemType === 'measured') {
    return { quantity: Math.round(driverValue * lib.factor * 100) / 100, rate: Math.round(lib.rate * factor / 10) * 10, unit: lib.unit }
  }
  const base = lib.driver === 'lump' || lib.driver === 'none' ? lib.rate : lib.rate * driverValue * lib.factor
  return { quantity: 1, rate: Math.round(base * factor / 100) * 100, unit: 'Sum' }
}

/**
 * Build the first draft of a BQ from the standard bills and library, shaped by the prerequisites
 * the user has (e.g. no structural drawings → substructure & frame marked provisional).
 */
export async function generateBq(project: ProjectRow) {
  const db = useDb()
  const params = normaliseParams(project.params as Partial<ProjectParams>)
  const drivers = computeDrivers(params)
  const factors = await rateFactors(project.locationId, project.finishKey)
  const prereq = project.prerequisites ?? {}
  const [templates, library] = await Promise.all([
    db.select().from(t.billTemplates).orderBy(asc(t.billTemplates.sort)),
    db.select().from(t.libraryItems).where(eq(t.libraryItems.active, true)).orderBy(asc(t.libraryItems.sort))
  ])

  const structuralMissing = prereq.structural !== 'have'
  const siteMissing = prereq.site !== 'have'
  const formworkMissing = prereq.formwork !== 'have'
  const approvalsPending = prereq.approvals !== 'have'
  const extraCodes = new Set<string>()
  if (siteMissing) extraCodes.add('PRO-140')
  if (approvalsPending) extraCodes.add('PRO-130')
  if (drivers.upper_floor_area! > 0) extraCodes.add('SUP-600')

  await db.transaction(async (tx) => {
    await tx.delete(t.projectBills).where(eq(t.projectBills.projectId, project.id))
    for (const tpl of templates) {
      const provisional = structuralMissing && (tpl.key === 'substructure' || tpl.key === 'superstructure')
      const [bill] = await tx.insert(t.projectBills).values({
        projectId: project.id, templateKey: tpl.key, number: tpl.number, title: tpl.title, sort: tpl.sort, provisional,
        notes: provisional ? 'All provisional: to be remeasured from structural drawings.' : ''
      }).returning()
      const rows = library
        .filter(l => l.billKey === tpl.key && (l.includeByDefault || extraCodes.has(l.code)) && appliesTo(l.methods, project.constructionMethod))
        .map((l, i) => {
          const line = libraryLine(l, drivers, factors)
          if (l.code === 'SUP-600') line.quantity = Math.max(1, drivers.floors! - 1)
          return { lib: l, line, i }
        })
        .filter(({ line }) => line.quantity > 0 && line.rate >= 0)
      if (rows.length && bill) {
        await tx.insert(t.projectItems).values(rows.map(({ lib, line, i }) => ({
          projectId: project.id, billId: bill.id, section: lib.section, description: lib.description, unit: line.unit,
          quantity: line.quantity, rate: line.rate, itemType: formworkMissing && lib.section === 'Formwork' && lib.itemType === 'measured' ? 'provisional' : lib.itemType, source: 'wizard', libraryCode: lib.code, sort: i + 1
        })))
      }
    }
    const assumptions = [
      `Quantities generated from: ${params.floorAreas.length} floor(s), total ${drivers.total_floor_area} m², perimeter ${drivers.ext_perimeter} m, wall height ${params.wallHeight} m.`,
      `Rates are indicative and adjusted for location (×${factors.location}) and finish level (×${factors.finish}).`,
      ...PREREQUISITES.filter(p => prereq[p.key] !== 'have').map(p => p.ifMissing)
    ].join('\n')
    const exclusions = [
      'Land costs, legal fees and financing costs.',
      'Loose furniture and appliances.',
      ...(prereq.approvals === 'have' ? ['Statutory approval fees (already obtained).'] : [])
    ].join('\n')
    await tx.update(t.projects).set({ assumptions, exclusions, updatedAt: new Date() }).where(and(eq(t.projects.id, project.id)))
  })
  return { drivers, factors }
}
