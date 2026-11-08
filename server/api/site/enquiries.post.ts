import { z } from 'zod'

const schema = z.object({
  site: z.string().trim().regex(/^[a-z0-9-]{2,40}$/).default('website'),
  kind: z.enum(['consultation', 'plan', 'contact', 'quote']).default('contact'),
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  phone: z.string().trim().max(30).default(''),
  email: z.string().trim().max(160).default(''),
  subject: z.string().trim().max(200).default(''),
  message: z.string().trim().max(4000).default(''),
  planRef: z.string().trim().max(80).default(''),
  /** Honeypot: real visitors never fill this hidden field. */
  website: z.string().max(200).optional()
}).refine(v => v.phone || v.email, { message: 'Provide a phone number or an email address.' })

/** Contact / consultation / plan enquiry from a company website (public, CORS for approved origins). */
export default defineEventHandler(async (event) => {
  const body = await parseBody(event, schema)
  if (body.website) return { ok: true } // silently drop bots
  const { website: _hp, ...data } = body
  const [row] = await useDb().insert(tables.siteEnquiries).values(data).returning({ id: tables.siteEnquiries.id })
  return { ok: true, id: row?.id }
})
