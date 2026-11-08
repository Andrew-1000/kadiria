import type { Options, PostgresType } from 'postgres'

/**
 * Make a DATABASE_URL safe to use:
 * - A password pasted as-is (e.g. containing % or ,) that isn't valid URL encoding is encoded.
 *   Already-encoded passwords are left unchanged.
 * - A Supabase *transaction* pooler address (…pooler.supabase.com:6543) is switched to the
 *   *session* pooler on the same host (port 5432). postgres.js pipelines queries, and through the
 *   transaction pooler pipelined queries mixed with transactions hang (tested November 2026);
 *   the session pooler handles both.
 */
export function normaliseDatabaseUrl(url: string): string {
  let out = url
  const m = out.match(/^(postgres(?:ql)?:\/\/[^:/@]+:)(.*)@([^@]+)$/)
  if (m) {
    const [, head, password, rest] = m as unknown as [string, string, string, string]
    try { decodeURIComponent(password) }
    catch { out = `${head}${encodeURIComponent(password)}@${rest}` }
  }
  return out.replace(/(@[^/@:]+\.pooler\.supabase\.com):6543(?=\/|$|\?)/, '$1:5432')
}

/**
 * postgres.js options for a (normalised) DATABASE_URL.
 * - Hosted Supabase: encrypted connection (sslmode=require).
 * - Serverless functions (Netlify): few connections per instance, closed when idle, so many
 *   instances fit within the session pooler's client limit.
 */
export function connectionOptions(url: string, max: number): Options<Record<string, PostgresType>> {
  let host = ''
  try { host = new URL(url).hostname }
  catch { /* leave defaults; postgres.js reports a bad URL itself */ }
  const supabase = /\.supabase\.(co|com)$/.test(host)
  const serverless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL)
  return {
    max: serverless ? Math.min(max, 3) : max,
    ...(serverless ? { idle_timeout: 20, connect_timeout: 10 } : {}),
    ...(supabase && !/sslmode=/.test(url) ? { ssl: 'require' as const } : {}),
    onnotice: () => {}
  }
}
