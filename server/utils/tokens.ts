import { seal, unseal, defaults } from 'iron-webcrypto'

/**
 * Bearer tokens for the company websites. The websites are static (GitHub Pages) on another
 * domain, so they cannot use the session cookie; they sign in through POST /api/auth/token and
 * send `Authorization: Bearer <token>`. Tokens are sealed (encrypted + signed) with the session
 * password and expire after TOKEN_TTL_MS.
 */
export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Web Crypto (Node 20+ globalThis.crypto); the library declares its own structural type for it.
const webCrypto = globalThis.crypto as unknown as Parameters<typeof seal>[0]

function tokenPassword(): string {
  const configured = (useRuntimeConfig() as { session?: { password?: string } }).session?.password
  const password = configured || process.env.NUXT_SESSION_PASSWORD || ''
  if (password.length < 32) throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_PASSWORD must be at least 32 characters.' })
  return password
}

export async function issueToken(userId: string): Promise<{ token: string, expiresAt: string }> {
  const token = await seal(webCrypto, { uid: userId, v: 1 }, tokenPassword(), { ...defaults, ttl: TOKEN_TTL_MS })
  return { token, expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() }
}

/** Returns the user id in a valid, unexpired token, or null. */
export async function readToken(token: string): Promise<string | null> {
  try {
    const data = await unseal(webCrypto, token, tokenPassword(), { ...defaults, ttl: TOKEN_TTL_MS }) as { uid?: unknown }
    return typeof data?.uid === 'string' ? data.uid : null
  }
  catch {
    return null
  }
}
