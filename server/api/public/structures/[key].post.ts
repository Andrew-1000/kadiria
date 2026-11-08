/** Cost, materials and BQ lines for one structure. */
export default defineEventHandler(async (event) => {
  await requireFeature('material_calculators')
  return runStructure(getRouterParam(event, 'key') ?? '', await parseBody(event, structureRunSchema))
})
