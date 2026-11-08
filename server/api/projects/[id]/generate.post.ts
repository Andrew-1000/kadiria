/** Re-generate the draft BQ from project parameters (replaces all bills and items). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const project = await loadProject(getRouterParam(event, 'id') ?? '', user, { editable: true })
  if ((project.params as { structure?: string }).structure) {
    throw createError({ statusCode: 422, statusMessage: 'This BQ was drafted from a structure calculator; regenerating would replace it with house bills. Edit its items instead, or draft it again from Other structures.' })
  }
  const result = await generateBq(project)
  await audit(user, 'BQ regenerated from parameters', { drivers: result.drivers, factors: result.factors }, project.id)
  return result
})
