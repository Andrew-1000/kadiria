import { asc, eq } from 'drizzle-orm'

/** Standard bills and library items, for signed-in users adding items to a BQ. */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const db = useDb()
  const [bills, items] = await Promise.all([
    db.select().from(tables.billTemplates).orderBy(asc(tables.billTemplates.sort)),
    db.select().from(tables.libraryItems).where(eq(tables.libraryItems.active, true)).orderBy(asc(tables.libraryItems.billKey), asc(tables.libraryItems.sort))
  ])
  return { bills, items }
})
