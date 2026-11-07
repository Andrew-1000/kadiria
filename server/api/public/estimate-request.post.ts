import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  phone: z.string().trim().max(30).default(''),
  email: z.string().trim().max(160).default(''),
  message: z.string().trim().max(2000).default(''),
  estimate: estimateSchema
}).refine(v => v.phone || v.email, { message: 'Provide a phone number or an email address.' })

/** Homeowner asks the company for a detailed BQ; stored as a lead for the admin. */
export default defineEventHandler(async (event) => {
  await requireFeature('cost_estimator')
  await requireFeature('estimate_requests')
  const body = await parseBody(event, schema)
  const result = await runEstimate(body.estimate)
  const [row] = await useDb().insert(tables.estimateRequests).values({
    name: body.name, phone: body.phone, email: body.email, message: body.message, inputs: body.estimate, result
  }).returning({ id: tables.estimateRequests.id })
  return { ok: true, id: row?.id }
})
