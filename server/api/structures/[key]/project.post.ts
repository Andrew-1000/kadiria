import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { asc } from 'drizzle-orm'

const schema = structureRunSchema.extend({
  name: z.string().trim().min(1).max(160),
  client: z.string().trim().max(160).default(''),
  siteAddress: z.string().trim().max(300).default(''),
  measurementStandard: z.string().trim().regex(/^[a-z0-9_]{1,60}$/).default('smm_ea')
})

/** Create a BQ project from a structure: one bill per kind of work, items priced like calculator results. */
export default defineEventHandler(async (event) => {
  await requireFeature('bq_projects')
  const user = await requireUser(event)
  const body = await parseBody(event, schema)
  const run = await runStructure(getRouterParam(event, 'key') ?? '', body)
  const db = useDb()
  const templates = await db.select().from(tables.billTemplates).orderBy(asc(tables.billTemplates.sort))
  const used = new Set(run.parts.flatMap(p => p.bqLines.map(l => l.billKey)))
  const id = randomUUID()
  const inputsText = Object.entries(run.inputs).map(([k, v]) => `${k} ${v}`).join(', ')
  await db.transaction(async (tx) => {
    await tx.insert(tables.projects).values({
      id, lineageId: id, ownerId: user.id, name: body.name, client: body.client, siteAddress: body.siteAddress, preparedBy: user.name,
      locationId: body.locationId ?? null, buildingTypeKey: null, finishKey: 'standard', measurementStandard: body.measurementStandard,
      params: { floorAreas: [0], structure: run.structure.key, inputs: run.inputs },
      assumptions: [
        `Drafted from the Kadiria "${run.structure.name}" calculator: ${inputsText}.`,
        `Quantities include ${run.wastagePercent}% wastage; rates from current material prices plus labour and overheads, or the BQ library where no material price applies.`,
        ...(run.missingPrices.length ? [`No price set yet for: ${run.missingPrices.map(m => m.label).join(', ')}. Those items are at zero until priced.`] : [])
      ].join('\n')
    })
    let number = 0
    for (const tpl of templates.filter(t => used.has(t.key))) {
      number++
      const [bill] = await tx.insert(tables.projectBills).values({ projectId: id, templateKey: tpl.key, number, title: tpl.title, sort: number }).returning()
      const lines = run.parts.flatMap(p => p.bqLines.map(l => ({ ...l, part: p.label }))).filter(l => l.billKey === tpl.key && l.quantity > 0)
      if (lines.length && bill) {
        await tx.insert(tables.projectItems).values(lines.map((l, i) => ({
          projectId: id, billId: bill.id, section: l.section ?? l.part, description: l.description, unit: l.unit, quantity: l.quantity, rate: l.rate,
          itemType: 'measured' as const, source: 'calculator', libraryCode: l.libraryCode ?? null, sort: i + 1,
          calcSnapshot: { structure: run.structure, part: l.part, rateSource: l.rateSource }
        })))
      }
    }
  })
  await audit(user, 'Project created from structure', { structure: run.structure.name, name: body.name }, id)
  return { id }
})
