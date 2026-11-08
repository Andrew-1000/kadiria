import { z } from 'zod'
import { STRUCTURE_MAP } from '#shared/calc/structures'

export const structureRunSchema = z.object({
  inputs: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
  locationId: z.coerce.number().int().positive().nullable().optional(),
  wastagePercent: z.coerce.number().min(0).max(50).default(5)
})

/**
 * Compute a structure with the admin's constants and mixes, price each part's materials for the
 * location, and price its BQ lines (materials + labour uplift, else library rate).
 */
export async function runStructure(key: string, body: z.infer<typeof structureRunSchema>) {
  const def = STRUCTURE_MAP[key]
  if (!def) notFound('Structure')
  const [constants, mixes] = await Promise.all([getConstants(), getMixes()])
  const defaults = Object.fromEntries(def.inputs.map(i => [i.key, i.default]))
  const inputs = { ...defaults, ...body.inputs }
  const result = def.compute(inputs, { constants, mixes, wastagePercent: body.wastagePercent })
  const locationId = body.locationId ?? null
  const parts = []
  for (const part of result.parts) {
    const priced = await priceMaterials(part.materials, locationId)
    const pricing = await pricingContext(part.bqLines, locationId, 'standard')
    const lines = priceLines(part.bqLines, priced.items, pricing)
    parts.push({
      label: part.label,
      lines: part.lines,
      materials: priced.items,
      materialsTotal: priced.total,
      bqLines: lines.map(l => ({ ...l.line, rate: l.rate, amount: l.amount, rateSource: l.source })),
      total: Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100
    })
  }
  const missing = [...new Map(parts.flatMap(p => p.materials).filter(m => m.amount === null).map(m => [m.materialKey, m.label])).entries()].map(([key, label]) => ({ key, label }))
  return {
    structure: { key: def.key, name: def.name, group: def.group },
    inputs,
    wastagePercent: body.wastagePercent,
    summary: result.summary,
    warnings: result.warnings,
    parts,
    total: Math.round(parts.reduce((s, p) => s + p.total, 0) * 100) / 100,
    missingPrices: missing
  }
}
