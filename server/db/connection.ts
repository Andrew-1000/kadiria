import type { Options, PostgresType } from 'postgres'

/**
 * postgres.js options for a DATABASE_URL.
 * - Hosted Supabase: encrypted connection (sslmode=require).
 * - Supabase transaction pooler (port 6543, used from serverless hosts such as Netlify):
 *   prepared statements are not supported, so turn them off.
 * - Serverless functions: close idle connections quickly. Keep enough connections for the
 *   parallel queries a request makes (the public config runs ~12 at once): with too few,
 *   postgres.js pipelines queries on one connection, which the transaction pooler doesn't
 *   handle reliably, and the request hangs.
 */
export function connectionOptions(url: string, max: number): Options<Record<string, PostgresType>> {
  let host = ''
  let port = ''
  try {
    const u = new URL(url)
    host = u.hostname
    port = u.port
  }
  catch { /* leave defaults; postgres.js reports a bad URL itself */ }
  const supabase = /\.supabase\.(co|com)$/.test(host)
  const transactionPooler = port === '6543'
  const serverless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)
  return {
    max,
    ...(serverless ? { idle_timeout: 20, connect_timeout: 10 } : {}),
    prepare: !transactionPooler,
    // The transaction pooler stalls on pipelined queries (several sent on one connection
    // before the first finishes). 0 = one query at a time per connection; extra queries
    // wait for a free connection instead.
    ...(transactionPooler ? { max_pipeline: 0 } : {}),
    ...(supabase && !/sslmode=/.test(url) ? { ssl: 'require' as const } : {}),
    onnotice: () => {}
  }
}
