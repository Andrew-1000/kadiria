import { z } from 'zod'

/** Name printed at the top of BQs and cost reports, e.g. your company name. Empty = "Kadiria". */
const schema = z.object({ issuer: z.string().trim().max(120) })

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { issuer } = await parseBody(event, schema)
  await useDb().insert(tables.settings).values({ key: 'document_issuer', value: issuer })
    .onConflictDoUpdate({ target: tables.settings.key, set: { value: issuer, updatedAt: new Date() } })
  await audit(admin, 'Document issuer updated', { issuer })
  return { issuer }
})
