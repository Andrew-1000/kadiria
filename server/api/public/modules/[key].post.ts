export default defineEventHandler(async (event) => {
  await requireFeature('material_calculators')
  return runModule(getRouterParam(event, 'key') ?? '', await parseBody(event, moduleRunSchema))
})
