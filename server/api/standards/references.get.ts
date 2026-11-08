import { asc } from 'drizzle-orm'

/** Laws, regulations, tender documents and specifications behind BQs and measurement in Kenya. */
export default defineEventHandler(() => useDb().select().from(tables.measurementReferences).orderBy(asc(tables.measurementReferences.sort)))
