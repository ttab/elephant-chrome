import { tokenClient } from './tokenClient'

interface CachedSession {
  accessToken: string
}

/**
 * The current access token, for callers that are not React components.
 *
 * The caching, the in-flight dedupe and the expiry margin all live in
 * `TokenClient` now — it refetches ahead of expiry with jitter and collapses
 * concurrent callers into one request — so this is a thin shim over the same
 * client the `SessionProvider` uses. `force` maps onto `update()`, which
 * bypasses the cache and resolves with the new token.
 */
export async function getCachedSession(options?: { force?: boolean }): Promise<CachedSession | null> {
  if (options?.force) {
    const state = await tokenClient.update()
    return state.session ? { accessToken: state.session.accessToken } : null
  }

  const accessToken = await tokenClient.getAccessToken()

  return accessToken ? { accessToken } : null
}

/**
 * Kept for the call sites that had it. There is no separate cache to clear any
 * more: the token client owns the only one, and it invalidates on expiry and on
 * a 401 by itself.
 */
export function clearCachedSession(): void {
  // Intentionally empty — see above.
}
