import { inArray } from 'drizzle-orm'
import { constant } from '#shared/calc/core'
import type { BqLine } from '#shared/calc/types'

type PricedMaterial = Awaited<ReturnType<typeof priceMaterials>>['items'][number]

/**
 * Assign each material to the BQ line it is part of, so no cost is counted twice. A line can
 * name its materials explicitly (e.g. formwork timber → the formwork line); otherwise reinforcement
 * → the kg line, BRC mesh → mesh line, DPM → membrane line, hoop iron → hoop-iron line, and
 * everything else → the line that carries the material cost.
 */
export function routeMaterials(lines: BqLine[], materials: PricedMaterial[]) {
  const find = (test: (l: BqLine) => boolean) => lines.findIndex(test)
  const carrier = find(l => !!l.carriesMaterialCost)
  const steel = find(l => l.unit === 'kg')
  const mesh = find(l => l.libraryCode === 'SUB-620')
  const dpm = find(l => l.libraryCode === 'SUB-610')
  const hoop = find(l => l.libraryCode === 'SUP-510')
  const out = new Map<number, PricedMaterial[]>()
  for (const m of materials) {
    let target = carrier
    const named = find(l => !!l.materials?.includes(m.materialKey))
    if (named >= 0) target = named
    else if (/^[yr]\d+$/.test(m.materialKey) || m.materialKey === 'binding_wire') target = steel >= 0 ? steel : carrier
    else if (m.materialKey.startsWith('brc_')) target = mesh >= 0 ? mesh : carrier
    else if (m.materialKey === 'dpm') target = dpm >= 0 ? dpm : carrier
    else if (m.materialKey === 'hoop_iron') target = hoop >= 0 ? hoop : carrier
    if (target < 0) continue
    out.set(target, [...(out.get(target) ?? []), m])
  }
  return out
}

export interface PricingContext {
  library: { code: string, rate: number, finishSensitive: boolean }[]
  factors: { location: number, finish: number }
  /** 1 + labour & overheads on calculator material cost */
  uplift: number
}

/** Load what pricing needs: library rates for the lines' codes, location/finish factors and the labour uplift. */
export async function pricingContext(lines: BqLine[], locationId: number | null, finishKey: string | null): Promise<PricingContext> {
  const codes = [...new Set(lines.map(l => l.libraryCode ?? '').filter(Boolean))]
  const [library, factors, constants] = await Promise.all([
    codes.length ? useDb().select().from(tables.libraryItems).where(inArray(tables.libraryItems.code, codes)) : Promise.resolve([]),
    rateFactors(locationId, finishKey),
    getConstants()
  ])
  return { library, factors, uplift: 1 + constant(constants, 'bq_labour_uplift_percent') / 100 }
}

/**
 * Rate for each BQ line: from its own materials plus labour uplift when all of them are priced,
 * otherwise from the BQ library (location and finish adjusted), otherwise zero.
 */
export function priceLines(lines: BqLine[], materials: PricedMaterial[], ctx: PricingContext) {
  const routed = routeMaterials(lines, materials)
  return lines.map((line, index) => {
    const lib = ctx.library.find(l => l.code === line.libraryCode)
    let rate = lib ? Math.round(lib.rate * ctx.factors.location * (lib.finishSensitive ? ctx.factors.finish : 1) / 10) * 10 : 0
    const own = routed.get(index) ?? []
    const ownTotal = own.reduce((s, m) => s + (m.amount ?? 0), 0)
    const fullyPriced = own.length > 0 && own.every(m => m.amount !== null)
    if (fullyPriced && line.quantity > 0) rate = Math.round(ownTotal / line.quantity * ctx.uplift / 10) * 10
    const source: 'materials' | 'library' | 'none' = fullyPriced ? 'materials' : lib ? 'library' : 'none'
    return { line, rate, amount: Math.round(rate * line.quantity * 100) / 100, own, ownTotal: Math.round(ownTotal * 100) / 100, fullyPriced, source }
  })
}
