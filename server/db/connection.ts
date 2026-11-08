import type { Options, PostgresType } from 'postgres'

/**
 * postgres.js options for a DATABASE_URL.
 * - Hosted Supabase: encrypted connection (sslmode=require).
 * - Supabase transaction pooler (port 6543, used from serverless hosts such as Netlify):
 *   prepared statements are not supported, so turn them off.
 * - Serverless functions: keep few connections per instance; the pooler does the rest.
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
    max: serverless ? Math.min(max, 2) : max,
    prepare: !transactionPooler,
    ...(supabase && !/sslmode=/.test(url) ? { ssl: 'require' as const } : {}),
    onnotice: () => {}
  }
}
