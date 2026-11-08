import { asc, eq } from 'drizzle-orm'
import { computeDrivers, DRIVERS, type ProjectParams } from '#shared/calc/bq'
import { MODULE_MAP } from '#shared/calc/modules'
import { autoRate } from '#shared/calc/estimator'
import { round } from '#shared/calc/core'
import type { PricedMaterial } from '#shared/calc/types'

/*
 * Detailed cost report for a homeowner estimate request: shows, step by step, how every figure
 * is derived from what the administrator has defined in the system (rate bands, factors, library
 * rates, material prices, constants). It is recomputed from today's configuration.
 */

const fmt = (n: number, d = 2) => n.toLocaleString('en-KE', { maximumFractionDigits: d })
/** Unit of a quantity driver, taken from its label, e.g. "Total floor area (m²)" → "m²". */
const driverUnit = (key: string) => DRIVERS[key]?.match(/\(([^)]+)\)$/)?.[1] ?? 'unit'

export interface ReportStep { label: string, formula: string, value: number, unit?: string }

export interface ReportLine {
  code: string
  section: string
  description: string
  itemType: string
  unit: string
  quantity: number
  quantityBasis: string
  baseRate: number
  rate: number
  rateBasis: string
  amount: number
}

function driverFormula(key: string, p: ProjectParams, d: Record<string, number>): string {
  const floors = d.floors ?? 1
  switch (key) {
    case 'footprint_area': return `Ground floor area = ${fmt(d.footprint_area!)} m²`
    case 'total_floor_area': return `${p.floorAreas.map(a => fmt(a)).join(' + ')} = ${fmt(d.total_floor_area!)} m²`
    case 'upper_floor_area': return `${fmt(d.total_floor_area!)} − ${fmt(d.footprint_area!)} = ${fmt(d.upper_floor_area!)} m²`
    case 'ext_perimeter': return p.perimeter > 0 ? `Given: ${fmt(p.perimeter)} m` : `4 × √${fmt(d.footprint_area!)} × 1.15 shape allowance = ${fmt(d.ext_perimeter!)} m`
    case 'foundation_length': return `Perimeter ${fmt(d.ext_perimeter!)} + ground floor internal walls (${fmt(d.footprint_area!)} × ${p.internalWallRatio}) = ${fmt(d.foundation_length!)} m`
    case 'trench_volume': return `${fmt(d.foundation_length!)} m × 0.6 m wide × ${p.foundationDepth} m deep = ${fmt(d.trench_volume!)} m³`
    case 'ext_wall_area': return `${fmt(d.ext_perimeter!)} m × ${p.wallHeight} m × ${floors} floor(s) − openings (${p.windows} windows × ${p.windowSize} m² + external doors) = ${fmt(d.ext_wall_area!)} m²`
    case 'int_wall_area': return `${fmt(d.total_floor_area!)} m² × ${p.internalWallRatio} m/m² × ${p.wallHeight} m − internal door openings = ${fmt(d.int_wall_area!)} m²`
    case 'wall_area': return `${fmt(d.ext_wall_area!)} + ${fmt(d.int_wall_area!)} = ${fmt(d.wall_area!)} m²`
    case 'plaster_area': return `Internal walls both faces (${fmt(d.int_wall_area!)} × 2) + inside face of external walls ${fmt(d.ext_wall_area!)} = ${fmt(d.plaster_area!)} m²`
    case 'roof_area': return `(${fmt(d.footprint_area!)} + ${fmt(d.ext_perimeter!)} × ${p.roofOverhang} m overhang) × ${p.roofPitchFactor} slope = ${fmt(d.roof_area!)} m²`
    case 'window_area': return `${p.windows} × ${p.windowSize} m² = ${fmt(d.window_area!)} m²`
    case 'doors': return `Assumed ${p.doors} doors for ${fmt(d.total_floor_area!)} m²`
    case 'windows': return `Assumed ${p.windows} windows for ${fmt(d.total_floor_area!)} m²`
    case 'floors': return `${floors} floor(s)`
    case 'lump': return 'Lump sum'
    default: return ''
  }
}

export async function buildLeadReport(id: string) {
  const db = useDb()
  const t = tables
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound('Estimate request')
  const [lead] = await db.select().from(t.estimateRequests).where(eq(t.estimateRequests.id, id))
  if (!lead) notFound('Estimate request')

  const parsed = estimateSchema.safeParse(lead.inputs)
  if (!parsed.success) throw createError({ statusCode: 422, statusMessage: 'This request was stored in an older format and cannot be re-priced.' })
  const inputs = parsed.data
  const [loc] = await db.select().from(t.locations).where(eq(t.locations.id, inputs.locationId))
  if (!loc) throw createError({ statusCode: 422, statusMessage: 'The location on this request no longer exists in the system.' })

  const [[tier], [bt], [finish], rates, addons, elements, constants, mixes, modules, templates, library] = await Promise.all([
    db.select().from(t.rateTiers).where(eq(t.rateTiers.id, loc.tierId)),
    db.select().from(t.buildingTypes).where(eq(t.buildingTypes.key, inputs.buildingTypeKey)),
    db.select().from(t.finishLevels).where(eq(t.finishLevels.key, inputs.finishKey)),
    getCurrentCostRates(),
    db.select().from(t.estimateAddons).orderBy(asc(t.estimateAddons.sort)),
    db.select().from(t.elementSplits).orderBy(asc(t.elementSplits.sort)),
    getConstants(),
    getMixes(),
    getModules(true),
    db.select().from(t.billTemplates).orderBy(asc(t.billTemplates.sort)),
    db.select().from(t.libraryItems).where(eq(t.libraryItems.active, true)).orderBy(asc(t.libraryItems.sort))
  ])
  if (!bt || !finish || !tier) throw createError({ statusCode: 422, statusMessage: 'The building type or finish on this request no longer exists.' })
  const [country] = await db.select().from(t.countries).where(eq(t.countries.code, tier.countryCode))
  const currency = country?.currency ?? 'KES'
  const vatPercent = country?.vatPercent ?? 16
  const band = rates.find(r => r.tierId === loc.tierId && r.finishKey === finish.key)
  if (!band) throw createError({ statusCode: 422, statusMessage: 'No cost-per-m² rate is configured for this location and finish.' })

  /* ---------------- A. Estimator derivation ---------------- */
  const est = await runEstimate(inputs)
  const floorAreas = inputs.floorAreas.slice(0, Math.max(bt.minFloors, Math.min(bt.maxFloors, inputs.floorAreas.length)))
  const mid = (band.minRate + band.maxRate) / 2
  const methodFactor = est.methodFactor ?? 1
  const auto = autoRate(band, loc.adjustmentPercent, bt.factor * methodFactor)
  const ownRate = inputs.ratePerM2 && inputs.ratePerM2 > 0 ? inputs.ratePerM2 : null
  const chosenAddons = inputs.addonKeys ? addons.filter(a => inputs.addonKeys!.includes(a.key)) : addons.filter(a => a.enabledByDefault)
  const estimatorSteps: ReportStep[] = [
    { label: `Cost band: ${tier.label}, ${finish.label}`, formula: `Admin rate card, effective ${band.effectiveFrom}${band.note ? ` (${band.note})` : ''}: ${currency} ${fmt(band.minRate, 0)} – ${fmt(band.maxRate, 0)} per m²`, value: mid, unit: `${currency}/m² midpoint` },
    { label: 'Location adjustment', formula: `${loc.name}: ${loc.adjustmentPercent >= 0 ? '+' : ''}${loc.adjustmentPercent}%`, value: round(mid * (1 + loc.adjustmentPercent / 100)), unit: `${currency}/m²` },
    { label: 'Building type factor', formula: `${bt.label}: × ${bt.factor}`, value: round(mid * (1 + loc.adjustmentPercent / 100) * bt.factor), unit: `${currency}/m²` },
    ...(methodFactor !== 1 ? [{ label: 'Construction method factor', formula: `${est.constructionMethod}: × ${methodFactor} (relative to stone / block masonry)`, value: round(mid * (1 + loc.adjustmentPercent / 100) * bt.factor * methodFactor), unit: `${currency}/m²` }] : []),
    { label: 'Auto-selected rate', formula: 'Rounded to the nearest 100', value: auto, unit: `${currency}/m²` },
    ...(ownRate ? [{ label: 'Rate used (requester\'s own figure)', formula: `The requester entered their own rate instead of ${fmt(auto, 0)}`, value: ownRate, unit: `${currency}/m²` }] : []),
    { label: 'Total floor area', formula: floorAreas.map(a => `${fmt(a)} m²`).join(' + '), value: est.totalArea, unit: 'm²' },
    { label: 'Materials', formula: `${fmt(est.totalArea)} m² × ${fmt(est.ratePerM2, 0)}`, value: est.materials, unit: currency },
    { label: 'Labour', formula: `${fmt(est.materials, 0)} × ${finish.labourPercent}% (${finish.label} labour rate)`, value: est.labour, unit: currency },
    { label: 'Construction cost', formula: 'Materials + labour', value: est.construction, unit: currency },
    ...est.addons.map(a => ({ label: a.label, formula: `${fmt(est.construction, 0)} × ${a.percent}%`, value: a.amount, unit: currency })),
    { label: 'Estimated total', formula: 'Construction cost + selected add-ons', value: est.total, unit: currency }
  ]

  /* ---------------- B. Quantities derived from the floor areas ---------------- */
  const totalArea = floorAreas.reduce((s, a) => s + a, 0)
  const params = normaliseParams({
    floorAreas,
    doors: Math.max(4, Math.round(totalArea / 15)),
    windows: Math.max(4, Math.round(totalArea / 10))
  })
  const drivers = computeDrivers(params)
  const quantityKeys = ['total_floor_area', 'footprint_area', 'upper_floor_area', 'ext_perimeter', 'foundation_length', 'trench_volume', 'ext_wall_area', 'int_wall_area', 'plaster_area', 'roof_area', 'window_area', 'doors', 'windows']
  const quantities = quantityKeys
    .filter(k => k !== 'upper_floor_area' || drivers.upper_floor_area! > 0)
    .map(k => ({ key: k, label: DRIVERS[k] ?? k, value: drivers[k] ?? 0, formula: driverFormula(k, params, drivers) }))
  const assumptions = [
    `Storey height ${params.wallHeight} m; foundation depth ${params.foundationDepth} m; trench width 0.6 m.`,
    `Internal walls ${params.internalWallRatio} m per m² of floor; ${params.doors} doors and ${params.windows} windows of ${params.windowSize} m² (scaled to floor area).`,
    `Roof overhang ${params.roofOverhang} m with a slope factor of ${params.roofPitchFactor} (about 30° pitch).`,
    'Normal soil assumed; rock excavation and dewatering are shown as a provisional sum.',
    'Electrical, plumbing and drainage are provisional sums until engineer designs are available.'
  ]

  /* ---------------- C. Itemised elemental estimate (BQ library) ---------------- */
  const factors = await rateFactors(loc.id, finish.key)
  const extra = new Set(['PRO-130', 'PRO-140', ...(drivers.upper_floor_area! > 0 ? ['SUP-600'] : [])])
  const bills = templates.map((tpl) => {
    const lines: ReportLine[] = library
      .filter(l => l.billKey === tpl.key && (l.includeByDefault || extra.has(l.code)))
      .map((l) => {
        const line = libraryLine(l, drivers, factors)
        if (l.code === 'SUP-600') line.quantity = Math.max(1, drivers.floors! - 1)
        const dv = drivers[l.driver] ?? 0
        const finishPart = l.finishSensitive ? ` × finish ${factors.finish}` : ''
        let quantityBasis: string
        let rateBasis: string
        if (l.itemType === 'measured') {
          quantityBasis = l.code === 'SUP-600'
            ? `${drivers.floors} floors − 1`
            : l.driver === 'lump' ? '1 item' : `${DRIVERS[l.driver] ?? l.driver} ${fmt(dv)}${l.factor !== 1 ? ` × ${l.factor}` : ''}`
          rateBasis = `Library ${fmt(l.rate, 0)} × location ${factors.location}${finishPart}, to nearest 10`
        }
        else {
          quantityBasis = 'Sum'
          rateBasis = l.driver === 'lump' || l.driver === 'none'
            ? `Library sum ${fmt(l.rate, 0)} × location ${factors.location}${finishPart}, to nearest 100`
            : `${fmt(l.rate, 0)} per ${driverUnit(l.driver)} × ${DRIVERS[l.driver] ?? l.driver} ${fmt(dv)}${l.factor !== 1 ? ` × ${l.factor}` : ''} × location ${factors.location}${finishPart}, to nearest 100`
        }
        return {
          code: l.code, section: l.section, description: l.description, itemType: l.itemType, unit: line.unit,
          quantity: line.quantity, quantityBasis, baseRate: l.rate, rate: line.rate, rateBasis, amount: round(line.quantity * line.rate)
        }
      })
      .filter(l => l.quantity > 0)
    return { key: tpl.key, number: tpl.number, title: tpl.title, description: tpl.description, lines, total: round(lines.reduce((s, l) => s + l.amount, 0)) }
  }).filter(b => b.lines.length)

  const subtotal = round(bills.reduce((s, b) => s + b.total, 0))
  // The requester's add-ons apply to the itemised estimate too, except the approvals %:
  // statutory fees are already priced as their own provisional sum (PRO-130).
  const itemisedAddons = chosenAddons.filter(a => a.key !== 'approvals').map(a => ({ key: a.key, label: a.label, percent: a.percent, amount: round(subtotal * a.percent / 100) }))
  const beforeVat = round(subtotal + itemisedAddons.reduce((s, a) => s + a.amount, 0))
  const vat = round(beforeVat * vatPercent / 100)

  const statutory = bills.flatMap(b => b.lines).filter(l => l.code === 'PRO-130')
  const services = bills.find(b => b.key === 'services')

  /* ---------------- D. Materials schedule (calculator modules) ---------------- */
  const F = drivers.foundation_length!
  const footprint = drivers.footprint_area!
  const floors = drivers.floors!
  const intLength = drivers.total_floor_area! * params.internalWallRatio
  const runs: { key: string, label: string, inputs: Record<string, number | string> }[] = [
    { key: 'excavation', label: 'Excavation', inputs: { length: F, depth: params.foundationDepth, siteArea: round(footprint * 1.5) } },
    { key: 'blinding', label: 'Blinding concrete', inputs: { perimeter: F } },
    { key: 'strip_footing', label: 'Strip footings', inputs: { length: F } },
    { key: 'foundation_walling', label: 'Foundation walling to DPC', inputs: { length: F, height: round(Math.max(0.45, params.foundationDepth - 0.05)) } },
    { key: 'hardcore', label: 'Hardcore under slab', inputs: { area: footprint } },
    { key: 'ground_slab', label: 'Ground floor slab', inputs: { area: footprint } },
    { key: 'columns', label: 'Columns', inputs: { count: Math.max(4, Math.ceil(footprint / 12)), height: params.wallHeight * floors } },
    { key: 'walling', label: 'External walling', inputs: { length: round(drivers.ext_perimeter! * floors), height: params.wallHeight, openings: round(drivers.ext_perimeter! * floors * params.wallHeight - drivers.ext_wall_area!), thickness: 0.2 } },
    { key: 'walling', label: 'Internal walling', inputs: { length: round(intLength), height: params.wallHeight, openings: round(Math.max(0, intLength * params.wallHeight - drivers.int_wall_area!)), thickness: 0.15 } },
    { key: 'beams', label: 'Ring beams & lintels', inputs: { length: round((drivers.ext_perimeter! + footprint * params.internalWallRatio) * floors), soffit: 0 } },
    ...(drivers.upper_floor_area! > 0 ? [{ key: 'suspended_slab', label: 'Suspended slabs', inputs: { area: drivers.upper_floor_area!, perimeter: round(drivers.ext_perimeter! * (floors - 1)) } }] : []),
    // Roof over the footprint, taken as a 1.5 : 1 rectangle
    { key: 'roofing', label: 'Roof structure & covering', inputs: { length: round(Math.sqrt(footprint * 1.5)), width: round(footprint / Math.sqrt(footprint * 1.5)), overhang: params.roofOverhang } },
    { key: 'plaster', label: 'Internal plaster', inputs: { area: drivers.plaster_area!, thickness: 0.015, location: 'internal' } },
    { key: 'plaster', label: 'External render', inputs: { area: drivers.ext_wall_area!, thickness: 0.02, location: 'external' } },
    { key: 'tiling', label: 'Floor tiling', inputs: { area: drivers.total_floor_area! } },
    { key: 'painting', label: 'Internal painting (walls & ceilings)', inputs: { area: round(drivers.plaster_area! + drivers.total_floor_area!), surface: 'internal' } },
    { key: 'painting', label: 'External painting', inputs: { area: drivers.ext_wall_area!, surface: 'external' } }
  ]
  const wastagePercent = 5
  const elementsMaterials: { key: string, stage: string, onSite: string, label: string, inputs: Record<string, number | string>, materials: PricedMaterial[], total: number, missing: number }[] = []
  for (const r of runs) {
    const def = MODULE_MAP[r.key]
    if (!def) continue
    const cfg = modules.find(m => m.key === r.key)
    const defaults = Object.fromEntries((cfg?.inputs ?? def.inputs).map(i => [i.key, i.default]))
    const used = { ...defaults, ...r.inputs } as Record<string, number | string>
    const out = def.compute(used, { constants, mixes, wastagePercent })
    const priced = await priceMaterials(out.materials, loc.id)
    elementsMaterials.push({ key: r.key, stage: def.stage ?? '', onSite: def.onSite ?? '', label: r.label, inputs: used, materials: priced.items, total: priced.total, missing: priced.missing })
  }
  const consolidated = new Map<string, PricedMaterial>()
  for (const e of elementsMaterials) {
    for (const m of e.materials) {
      const c = consolidated.get(m.materialKey)
      if (c) {
        c.quantity = round(c.quantity + m.quantity, 2)
        c.amount = c.amount === null || m.amount === null ? null : round(c.amount + m.amount)
      }
      else consolidated.set(m.materialKey, { ...m })
    }
  }
  const materialsSchedule = [...consolidated.values()]
  const materialsTotal = round(materialsSchedule.reduce((s, m) => s + (m.amount ?? 0), 0))

  const usedConstants = ['concrete_dry_factor', 'mortar_dry_factor', 'cement_bag_volume', 'sand_density', 'ballast_density', 'hardcore_density', 'steel_lap_factor', 'rebar_length', 'stone_length', 'stone_height', 'mortar_joint']
  const constantRows = await db.select().from(t.calcConstants)
  const constantsUsed = usedConstants.map((k) => {
    const row = constantRows.find(c => c.key === k)
    return { key: k, label: row?.label ?? k, value: constants[k] ?? 0, unit: row?.unit ?? '' }
  })

  return {
    reference: `ER-${lead.id.slice(0, 8).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    currency,
    request: {
      id: lead.id, name: lead.name, phone: lead.phone, email: lead.email, message: lead.message, status: lead.status, createdAt: lead.createdAt,
      location: loc.name, tier: tier.label, buildingType: bt.label, finish: finish.label, floorAreas, budget: inputs.budget ?? null,
      addons: chosenAddons.map(a => `${a.label} (${a.percent}%)`)
    },
    estimator: {
      steps: estimatorSteps,
      range: { low: est.range.low, high: est.range.high, formula: `Floor area × band min/max (${fmt(band.minRate, 0)} / ${fmt(band.maxRate, 0)}) × location × building factor × method factor × (1 + labour) × (1 + add-ons)` },
      elements: est.elements,
      quotedTotal: (lead.result as { total?: number })?.total ?? null,
      currentTotal: est.total,
      budget: est.budget
    },
    quantities, assumptions,
    factors: {
      location: factors.location,
      finish: factors.finish,
      explanation: `Library rates are Nairobi / standard-finish baselines. Location factor = ${tier.label} standard midpoint ÷ base-tier standard midpoint × (1 ${loc.adjustmentPercent >= 0 ? '+' : '−'} ${Math.abs(loc.adjustmentPercent)}%) = ${factors.location}. Finish factor = ${finish.label} midpoint ÷ standard midpoint = ${factors.finish} (applied only to finish-sensitive items).`
    },
    bills,
    summary: { subtotal, addons: itemisedAddons, beforeVat, vatPercent, vat, grandTotal: round(beforeVat + vat), approvalsNote: chosenAddons.some(a => a.key === 'approvals') ? 'The approvals % add-on chosen in the estimator is replaced here by the statutory fees provisional sum (PRO-130), to avoid counting it twice.' : '' },
    highlights: {
      services: services ? { total: services.total, lines: services.lines.map(l => ({ description: l.description, amount: l.amount, basis: l.rateBasis })) } : null,
      statutory: statutory.map(l => ({ description: l.description, amount: l.amount, basis: l.rateBasis }))
    },
    materials: { wastagePercent, elements: elementsMaterials, schedule: materialsSchedule, total: materialsTotal, constants: constantsUsed },
    reconciliation: {
      estimatorTotal: est.total,
      itemisedBeforeVat: beforeVat,
      variancePercent: est.total > 0 ? round((beforeVat - est.total) / est.total * 100, 1) : 0
    }
  }
}

export type LeadReport = Awaited<ReturnType<typeof buildLeadReport>>
