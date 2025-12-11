import { getSession as nextAuthGetSession } from 'next-auth/react'
import type { Session } from 'next-auth'

type CachedSession = Session | null

let cachedSession: CachedSession | undefined
let inflightFetch: Promise<CachedSession> | null = null

const EXPIRY_SKEW_MS = 30_000

/**
 * Return the current NextAuth session while avoiding duplicate network calls.
 * The cache is invalidated automatically when the session is about to expire,
 * and can be bypassed via `force`.
 */
export async function getCachedSession(options?: { force?: boolean }): Promise<CachedSession> {
  if (!options?.force && typeof cachedSession !== 'undefined') {
    if (!cachedSession) {
      return cachedSession
    }

    const expiresAt = cachedSession.accessTokenExpires ? new Date(cachedSession.accessTokenExpires).getTime() : undefined
    if (!expiresAt || expiresAt - EXPIRY_SKEW_MS > Date.now()) {
      return cachedSession
    }
  }

  if (!options?.force && inflightFetch) {
    return inflightFetch
  }

  inflightFetch = nextAuthGetSession()
    .then((session) => {
      cachedSession = session ?? null
      inflightFetch = null
      return session
    })
    .catch((error) => {
      inflightFetch = null
      cachedSession = undefined
      throw error
    })

  return inflightFetch
}

export function clearCachedSession(): void {
  cachedSession = undefined
  inflightFetch = null
}
