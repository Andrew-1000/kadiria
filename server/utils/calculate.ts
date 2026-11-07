import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { MODULE_MAP } from '#shared/calc/modules'
import { autoRate, estimate } from '#shared/calc/estimator'

export const moduleRunSchema = z.object({
  inputs: z.record(z.string(), z.union([z.number(), z.string(), z.null()]).transform(v => v ?? undefined)).default({}),
  locationId: z.coerce.number().int().positive().nullable().optional(),
  wastagePercent: z.coerce.number().min(0).max(50).default(5),
  priceOverrides: z.record(z.string(), z.coerce.number().min(0).max(1e8)).default({})
})

export type ModuleRunBody = z.infer<typeof moduleRunSchema>

/** Runs a quantification module with admin constants/mixes and prices the materials. */
export async function runModule(key: string, body: ModuleRunBody) {
  const def = MODULE_MAP[key]
  if (!def) notFound('Calculator module')
  const modules = await getModules(true)
  const cfg = modules.find(m => m.key === key)
  if (!cfg?.enabled) throw createError({ statusCode: 403, statusMessage: 'This calculator module is switched off.' })
  const [constants, mixes] = await Promise.all([getConstants(), getMixes()])
  const defaults = Object.fromEntries(cfg.inputs.map(i => [i.key, i.default]))
  const inputs = { ...defaults, ...body.inputs }
  const result = def.compute(inputs, { constants, mixes, wastagePercent: body.wastagePercent })
  const priced = await priceMaterials(result.materials, body.locationId ?? null, body.priceOverrides)
  return {
    module: { key: def.key, name: def.name },
    inputs,
    wastagePercent: body.wastagePercent,
    ...result,
    materials: priced.items,
    materialsTotal: priced.total,
    missingPrices: priced.missing
  }
}

export const estimateSchema = z.object({
  locationId: z.coerce.number().int().positive(),
  buildingTypeKey: z.string(),
  finishKey: z.string(),
  floorAreas: z.array(z.coerce.number().min(0).max(100000)).min(1).max(100),
  ratePerM2: z.coerce.number().min(0).max(10_000_000).nullable().optional(),
  addonKeys: z.array(z.string()).optional(),
  budget: z.coerce.number().min(0).max(1e12).nullable().optional()
})

export type EstimateBody = z.infer<typeof estimateSchema>

/** Authoritative server-side estimate using the admin's current rates. */
export async function runEstimate(body: EstimateBody) {
  const db = useDb()
  const t = tables
  const [loc] = await db.select().from(t.locations).where(eq(t.locations.id, body.locationId))
  if (!loc) notFound('Location')
  const [[bt], [finish], rates, addons, elements, [tier]] = await Promise.all([
    db.select().from(t.buildingTypes).where(eq(t.buildingTypes.key, body.buildingTypeKey)),
    db.select().from(t.finishLevels).where(eq(t.finishLevels.key, body.finishKey)),
    getCurrentCostRates(),
    db.select().from(t.estimateAddons),
    db.select().from(t.elementSplits),
    db.select().from(t.rateTiers).where(eq(t.rateTiers.id, loc.tierId))
  ])
  if (!bt) notFound('Building type')
  if (!finish) notFound('Finish level')
  const band = rates.find(r => r.tierId === loc.tierId && r.finishKey === finish.key)
  if (!band) throw createError({ statusCode: 422, statusMessage: 'No cost rate is configured for this location and finish.' })
  const floorCount = Math.max(bt.minFloors, Math.min(bt.maxFloors, body.floorAreas.length))
  const floors = body.floorAreas.slice(0, floorCount)
  const auto = autoRate(band, loc.adjustmentPercent, bt.factor)
  const chosenAddons = body.addonKeys ? addons.filter(a => body.addonKeys!.includes(a.key)) : addons.filter(a => a.enabledByDefault)
  const result = estimate({
    floorAreas: floors,
    ratePerM2: body.ratePerM2 && body.ratePerM2 > 0 ? body.ratePerM2 : auto,
    band,
    labourPercent: finish.labourPercent,
    buildingFactor: bt.factor,
    locationAdjustmentPercent: loc.adjustmentPercent,
    addons: chosenAddons.sort((a, b) => a.sort - b.sort).map(a => ({ key: a.key, label: a.label, percent: a.percent })),
    elements: elements.sort((a, b) => a.sort - b.sort).map(e => ({ key: e.key, label: e.label, percent: e.percent })),
    budget: body.budget ?? null
  })
  return {
    ...result,
    autoRate: auto,
    location: loc.name,
    tier: tier?.label ?? '',
    buildingType: bt.label,
    finish: finish.label,
    labourPercent: finish.labourPercent,
    band: { minRate: band.minRate, maxRate: band.maxRate }
  }
}
