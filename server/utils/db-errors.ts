/** Turn low-level PostgreSQL / driver errors into an actionable explanation. */
export function explainDbError(e: unknown): string | null {
  const err = (e as { cause?: unknown })?.cause ?? e
  const { code, message } = (err ?? {}) as { code?: string, message?: string }
  const url = process.env.DATABASE_URL ?? ''
  if (!url) return 'DATABASE_URL is not set. Copy .env.example to .env and fill it in.'
  if (/CHANGE-ME/i.test(url)) return 'DATABASE_URL in .env still contains the CHANGE-ME placeholder. Set a real password, then run `npm run db:create` and `npm run db:setup`.'
  switch (code) {
    case '28P01': return 'PostgreSQL rejected the username/password in DATABASE_URL. Run `npm run db:create` to create the user with that password, or correct .env.'
    case '3D000': return 'The database named in DATABASE_URL does not exist. Run `npm run db:create`.'
    case '42P01': return 'The database has no tables yet. Run `npm run db:setup` (migrations + reference data).'
    case 'ECONNREFUSED': return 'Nothing is listening at the host/port in DATABASE_URL. Is PostgreSQL running?'
    case 'ENOTFOUND': return 'The database host in DATABASE_URL could not be resolved.'
  }
  if (message && /password authentication failed/i.test(message)) return 'PostgreSQL rejected the username/password in DATABASE_URL. Run `npm run db:create` or correct .env.'
  return null
}
