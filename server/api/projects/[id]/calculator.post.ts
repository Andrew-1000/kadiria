import { z } from 'zod'
import { asc, eq, max } from 'drizzle-orm'

const schema = moduleRunSchema.extend({
  moduleKey: z.string(),
  /** Indexes of result.bqLines to add; all when omitted. */
  lines: z.array(z.number().int().min(0)).optional()
})

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
  const bills = await db.select().from(tables.projectBills).where(eq(tables.projectBills.projectId, project.id)).orderBy(asc(tables.projectBills.sort))
  const pricing = await pricingContext(result.bqLines, project.locationId, project.finishKey)
  const priced = priceLines(result.bqLines, result.materials, pricing)
  const added = []
  for (const line of chosen) {
    const bill = bills.find(b => b.templateKey === line.billKey) ?? bills[0]
    if (!bill) throw createError({ statusCode: 422, statusMessage: 'This project has no bills. Add a bill first.' })
    const p = priced[result.bqLines.indexOf(line)]!
    const [agg] = await db.select({ s: max(tables.projectItems.sort) }).from(tables.projectItems).where(eq(tables.projectItems.billId, bill.id))
    const [item] = await db.insert(tables.projectItems).values({
      projectId: project.id, billId: bill.id, section: line.section ?? '', description: line.description, unit: line.unit,
      quantity: line.quantity, rate: p.rate, itemType: 'measured', source: 'calculator', libraryCode: line.libraryCode ?? null,
      sort: (agg?.s ?? 0) + 1,
      calcSnapshot: p.fullyPriced
        ? { module: result.module, inputs: result.inputs, wastagePercent: result.wastagePercent, materials: p.own, materialsTotal: p.ownTotal, labourUplift: pricing.uplift }
        : { module: result.module, inputs: result.inputs, rateSource: p.source }
    }).returning()
    added.push(item)
  }
  await touchProject(project.id)
  await audit(user, 'Calculator results added to BQ', { module: result.module.name, items: added.length }, project.id)
  return { added }
})
