/** Detailed, step-by-step cost report for an estimate request (admin only). */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const report = await buildLeadReport(getRouterParam(event, 'id') ?? '')
  await audit(admin, 'Estimate request report generated', { reference: report.reference, name: report.request.name })
  return report
})
