/** Re-generate the draft BQ from project parameters (replaces all bills and items). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  const result = await generateBq(project)
  await audit(user, 'BQ regenerated from parameters', { drivers: result.drivers, factors: result.factors }, project.id)
  return result
})
