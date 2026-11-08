/** Name printed at the top of BQs and cost reports (Admin → Website integration → Documents). */
export default defineEventHandler(async () => {
  const issuer = await getSetting<string>('document_issuer', '')
  return { issuer: (typeof issuer === 'string' && issuer.trim()) || 'Kadiria' }
})
