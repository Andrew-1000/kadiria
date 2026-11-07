export default defineEventHandler(async (event) => {
  await requireFeature('cost_estimator')
  return runEstimate(await parseBody(event, estimateSchema))
})
