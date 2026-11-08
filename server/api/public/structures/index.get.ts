import { STRUCTURE_LIST } from '#shared/calc/structures'

/** Other structures (boundary walls, latrines, septic tanks, services…) with their inputs. */
export default defineEventHandler(async () => {
  await requireFeature('material_calculators')
  return STRUCTURE_LIST
})
