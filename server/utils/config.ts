import { and, asc, desc, eq, inArray, isNull, lte, or } from 'drizzle-orm'
import { MODULES } from '#shared/calc/modules'
import { DEFAULT_CONSTANTS } from '#shared/calc/core'
import type { Constants, Mix, PricedMaterial, MaterialQty } from '#shared/calc/types'

const t = tables

export async function getFlags(): Promise<Record<string, boolean>> {
  const rows = await useDb().select().from(t.featureFlags)
  return Object.fromEntries(rows.map(r => [r.key, r.enabled]))
}

export async function requireFeature(key: string) {
  const flags = await getFlags()
  if (flags[key] === false) throw createError({ statusCode: 403, statusMessage: 'This feature is currently switched off by the administrator.' })
}

export async function getConstants(): Promise<Constants> {
  const rows = await useDb().select().from(t.calcConstants)
  return { ...DEFAULT_CONSTANTS, ...Object.fromEntries(rows.map(r => [r.key, r.value])) }
}

export async function getMixes(): Promise<Mix[]> {
  const rows = await useDb().select().from(t.mixDesigns).where(eq(t.mixDesigns.active, true)).orderBy(asc(t.mixDesigns.sort))
  return rows.map(r => ({ key: r.key, name: r.name, kind: r.kind, cement: r.cement, sand: r.sand, ballast: r.ballast }))
}

/** Latest effective cost-per-m² band for each tier × finish. */
export async function getCurrentCostRates(on = today()) {
  return useDb().selectDistinctOn([t.costRates.tierId, t.costRates.finishKey])
    .from(t.costRates)
    .where(lte(t.costRates.effectiveFrom, on))
    .orderBy(t.costRates.tierId, t.costRates.finishKey, desc(t.costRates.effectiveFrom), desc(t.costRates.recordedAt))
}

/** Modules merged with their admin settings (enabled flag, sort, default overrides). */
export async function getModules(includeDisabled = false) {
  const rows = await useDb().select().from(t.calcModules)
  const byKey = new Map(rows.map(r => [r.key, r]))
  return MODULES.map((m, index) => {
    const cfg = byKey.get(m.key)
    const defaults = cfg?.defaults ?? {}
    return {
      key: m.key, name: m.name, short: m.short, description: m.description, billKey: m.billKey, icon: m.icon, formula: m.formula,
      stage: m.stage ?? '', onSite: m.onSite ?? '', sequence: index + 1,
      inputs: m.inputs.map(i => ({ ...i, default: defaults[i.key] ?? i.default })),
      enabled: cfg?.enabled ?? true,
      sort: cfg?.sort ?? index
    }
  }).filter(m => includeDisabled || m.enabled).sort((a, b) => a.sort - b.sort)
}

/** Everything the public calculators need, in one request. */
export async function getPublicConfig() {
  const db = useDb()
  const [flags, countries, tiers, locations, finishes, rates, buildingTypes, addons, elements, mixes, constants, modules, methods] = await Promise.all([
    getFlags(),
    db.select().from(t.countries).where(eq(t.countries.active, true)).orderBy(asc(t.countries.sort)),
    db.select().from(t.rateTiers).orderBy(asc(t.rateTiers.sort)),
    db.select().from(t.locations).where(eq(t.locations.active, true)).orderBy(asc(t.locations.sort)),
    db.select().from(t.finishLevels).orderBy(asc(t.finishLevels.sort)),
    getCurrentCostRates(),
    db.select().from(t.buildingTypes).where(eq(t.buildingTypes.active, true)).orderBy(asc(t.buildingTypes.sort)),
    db.select().from(t.estimateAddons).orderBy(asc(t.estimateAddons.sort)),
    db.select().from(t.elementSplits).orderBy(asc(t.elementSplits.sort)),
    getMixes(),
    getConstants(),
    getModules(),
    db.select().from(t.constructionMethods).where(eq(t.constructionMethods.active, true)).orderBy(asc(t.constructionMethods.sort))
  ])
  return {
    flags, countries, tiers, locations, finishes, buildingTypes, addons, elements, mixes, constants, modules,
    methods: methods.map(m => ({ key: m.key, label: m.label, description: m.description, factor: m.factor, maxFloors: m.maxFloors, source: m.source })),
    rates: rates.map(r => ({ tierId: r.tierId, finishKey: r.finishKey, minRate: r.minRate, maxRate: r.maxRate, effectiveFrom: r.effectiveFrom }))
  }
}

/** Resolve current material prices for a location (location price wins over national default). */
export async function getMaterialPrices(locationId: number | null, keys?: string[]) {
  const db = useDb()
  const mats = await db.select().from(t.materials).where(keys?.length ? inArray(t.materials.key, keys) : eq(t.materials.active, true))
  if (!mats.length) return new Map<string, { price: number, source: 'location' | 'national', materialId: number, name: string, unit: string, effectiveFrom: string }>()
  const prices = await db.selectDistinctOn([t.materialPrices.materialId, t.materialPrices.locationId])
    .from(t.materialPrices)
    .where(and(
      inArray(t.materialPrices.materialId, mats.map(m => m.id)),
      lte(t.materialPrices.effectiveFrom, today()),
      locationId ? or(isNull(t.materialPrices.locationId), eq(t.materialPrices.locationId, locationId)) : isNull(t.materialPrices.locationId)
    ))
    .orderBy(t.materialPrices.materialId, t.materialPrices.locationId, desc(t.materialPrices.effectiveFrom), desc(t.materialPrices.recordedAt))
  const out = new Map<string, { price: number, source: 'location' | 'national', materialId: number, name: string, unit: string, effectiveFrom: string }>()
  for (const m of mats) {
    const local = prices.find(p => p.materialId === m.id && p.locationId === locationId && locationId !== null)
    const national = prices.find(p => p.materialId === m.id && p.locationId === null)
    const chosen = local ?? national
    if (chosen) out.set(m.key, { price: chosen.price, source: local ? 'location' : 'national', materialId: m.id, name: m.name, unit: m.unit, effectiveFrom: chosen.effectiveFrom })
  }
  return out
}

export async function priceMaterials(materials: MaterialQty[], locationId: number | null, overrides: Record<string, number> = {}): Promise<{ items: PricedMaterial[], total: number, missing: number }> {
  const prices = await getMaterialPrices(locationId, materials.map(m => m.materialKey))
  let total = 0
  let missing = 0
  const items = materials.map((m): PricedMaterial => {
    const override = overrides[m.materialKey]
    const found = prices.get(m.materialKey)
    const unitPrice = override !== undefined && override > 0 ? override : found?.price ?? null
    const amount = unitPrice === null ? null : Math.round(unitPrice * m.quantity * 100) / 100
    if (amount === null) missing++
    else total += amount
    return { ...m, unitPrice, amount, priceSource: override !== undefined && override > 0 ? 'override' : found ? found.source : 'missing', effectiveFrom: override !== undefined && override > 0 ? null : found?.effectiveFrom ?? null }
  })
  return { items, total: Math.round(total * 100) / 100, missing }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await useDb().select().from(t.settings).where(eq(t.settings.key, key))
  return (row?.value as T) ?? fallback
}
