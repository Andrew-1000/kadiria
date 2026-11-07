import { z } from 'zod'
import { asc, eq, inArray, max } from 'drizzle-orm'
import { constant } from '#shared/calc/core'

const schema = moduleRunSchema.extend({
  moduleKey: z.string(),
  /** Indexes of result.bqLines to add; all when omitted. */
  lines: z.array(z.number().int().min(0)).optional()
})

type Line = Awaited<ReturnType<typeof runModule>>['bqLines'][number]
type Priced = Awaited<ReturnType<typeof runModule>>['materials'][number]

/**
 * Assign each material to the BQ line it is part of, so no cost is counted twice. A line can
 * name its materials explicitly (e.g. formwork timber → formwork line, termiticide → anti-termite
 * line); otherwise reinforcement → the kg line, BRC mesh → mesh line, DPM → membrane line,
 * hoop iron → hoop-iron line, and everything else → the line that carries the material cost.
 */
function routeMaterials(lines: Line[], materials: Priced[]) {
  const find = (test: (l: Line) => boolean) => lines.findIndex(test)
  const carrier = find(l => !!l.carriesMaterialCost)
  const steel = find(l => l.unit === 'kg')
  const mesh = find(l => l.libraryCode === 'SUB-620')
  const dpm = find(l => l.libraryCode === 'SUB-610')
  const hoop = find(l => l.libraryCode === 'SUP-510')
  const out = new Map<number, Priced[]>()
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

/**
 * Runs a quantification module server-side (so admin constants apply) and adds the resulting
 * measured items to the matching bills. Rates come from the BQ library (location/finish adjusted);
 * the line that carries the material cost is priced from the material list plus a labour uplift.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parseBody(event, schema)
  const result = await runModule(body.moduleKey, { ...body, locationId: body.locationId ?? project.locationId })
  const chosen = result.bqLines.filter((_, i) => !body.lines || body.lines.includes(i)).filter(l => l.quantity > 0)
  if (!chosen.length) throw createError({ statusCode: 422, statusMessage: 'Nothing to add: the calculation produced no quantities.' })

  const db = useDb()
  const [bills, library, factors, constants] = await Promise.all([
    db.select().from(tables.projectBills).where(eq(tables.projectBills.projectId, project.id)).orderBy(asc(tables.projectBills.sort)),
    db.select().from(tables.libraryItems).where(inArray(tables.libraryItems.code, chosen.map(c => c.libraryCode ?? '').filter(Boolean))),
    rateFactors(project.locationId, project.finishKey),
    getConstants()
  ])
  const uplift = 1 + constant(constants, 'bq_labour_uplift_percent') / 100
  const routed = routeMaterials(result.bqLines, result.materials)
  const added = []
  for (const line of chosen) {
    const bill = bills.find(b => b.templateKey === line.billKey) ?? bills[0]
    if (!bill) throw createError({ statusCode: 422, statusMessage: 'This project has no bills. Add a bill first.' })
    const lib = library.find(l => l.code === line.libraryCode)
    let rate = lib ? Math.round(lib.rate * factors.location * (lib.finishSensitive ? factors.finish : 1) / 10) * 10 : 0
    // Price the line from the materials that belong to it (plus labour/overheads) when all are priced
    const own = routed.get(result.bqLines.indexOf(line)) ?? []
    const ownTotal = own.reduce((s, m) => s + (m.amount ?? 0), 0)
    const fullyPriced = own.length > 0 && own.every(m => m.amount !== null)
    if (fullyPriced && line.quantity > 0) rate = Math.round(ownTotal / line.quantity * uplift / 10) * 10
    const [agg] = await db.select({ s: max(tables.projectItems.sort) }).from(tables.projectItems).where(eq(tables.projectItems.billId, bill.id))
    const [item] = await db.insert(tables.projectItems).values({
      projectId: project.id, billId: bill.id, section: line.section ?? '', description: line.description, unit: line.unit,
      quantity: line.quantity, rate, itemType: 'measured', source: 'calculator', libraryCode: line.libraryCode ?? null,
      sort: (agg?.s ?? 0) + 1,
      calcSnapshot: fullyPriced
        ? { module: result.module, inputs: result.inputs, wastagePercent: result.wastagePercent, materials: own, materialsTotal: Math.round(ownTotal * 100) / 100, labourUplift: uplift }
        : { module: result.module, inputs: result.inputs, rateSource: lib ? 'library' : 'none' }
    }).returning()
    added.push(item)
  }
  await touchProject(project.id)
  await audit(user, 'Calculator results added to BQ', { module: result.module.name, items: added.length }, project.id)
  return { added }
})
