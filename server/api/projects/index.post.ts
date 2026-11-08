import { randomUUID } from 'node:crypto'

/** Create a project from the BQ wizard and (optionally) generate the first-draft bills. */
export default defineEventHandler(async (event) => {
  await requireFeature('bq_projects')
  const user = await requireUser(event)
  const body = await parseBody(event, projectSchema)
  const id = randomUUID()
  const [project] = await useDb().insert(tables.projects).values({
    id, lineageId: id, ownerId: user.id,
    name: body.name, client: body.client, siteAddress: body.siteAddress, preparedBy: body.preparedBy || user.name,
    locationId: body.locationId, buildingTypeKey: body.buildingTypeKey, finishKey: body.finishKey, currency: body.currency, measurementStandard: body.measurementStandard, constructionMethod: body.constructionMethod,
    params: normaliseParams(body.params) as unknown as Record<string, unknown>, prerequisites: body.prerequisites,
    contingencyPercent: body.contingencyPercent, vatPercent: body.vatPercent
  }).returning()
  if (!project) throw createError({ statusCode: 500, statusMessage: 'Could not create project.' })
  if (body.generate) await generateBq(project)
  else {
    // Empty BQ with the standard bills only
    const templates = await useDb().select().from(tables.billTemplates)
    if (templates.length) {
      await useDb().insert(tables.projectBills).values(templates.map(tpl => ({ projectId: id, templateKey: tpl.key, number: tpl.number, title: tpl.title, sort: tpl.sort })))
    }
  }
  await audit(user, 'Project created', { name: project.name, generated: body.generate }, id)
  return { id }
})
