import { z } from 'zod'
import { eq, inArray, max } from 'drizzle-orm'
import { computeDrivers, type ProjectParams } from '#shared/calc/bq'

const schema = z.object({ billId: z.string().uuid(), codes: z.array(z.string()).min(1).max(100) })

/** Add standard library items to a bill, priced and measured from project parameters. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const body = await parseBody(event, schema)
  await assertBill(project.id, body.billId)
  const db = useDb()
  const library = await db.select().from(tables.libraryItems).where(inArray(tables.libraryItems.code, body.codes))
  const drivers = computeDrivers(normaliseParams(project.params as Partial<ProjectParams>))
  const factors = await rateFactors(project.locationId, project.finishKey)
  const [agg] = await db.select({ s: max(tables.projectItems.sort) }).from(tables.projectItems).where(eq(tables.projectItems.billId, body.billId))
  let sort = agg?.s ?? 0
  const rows = library.map((lib) => {
    const line = libraryLine(lib, drivers, factors)
    return {
      projectId: project.id, billId: body.billId, section: lib.section, description: lib.description, unit: line.unit,
      quantity: line.quantity, rate: line.rate, itemType: lib.itemType, source: 'library', libraryCode: lib.code, sort: ++sort
    }
  })
  const added = rows.length ? await db.insert(tables.projectItems).values(rows).returning() : []
  await touchProject(project.id)
  return { added }
})
