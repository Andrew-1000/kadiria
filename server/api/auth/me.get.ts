/** The current user (bearer token or session cookie). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { user }
})
