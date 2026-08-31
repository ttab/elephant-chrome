import { TokenClient } from '@ttab/tt-session/react'

/**
 * The single token cache for the whole app.
 *
 * The singleton is the point: a hundred components asking for a token at once
 * must produce one request, or the token endpoint's 60/min budget turns an
 * ordinary render into a 429. Sharing it with the React provider is also what
 * lets non-React callers — `getCachedSession()`, the spellchecker, the image
 * helpers — read the same token the UI is holding, instead of keeping a second
 * cache that can disagree with it.
 *
 * Browser only. It fetches a relative endpoint and is never imported by
 * `src-srv`.
 */
export const tokenClient = new TokenClient({
  endpoint: `${import.meta.env.BASE_URL || ''}/api/session/token`
})
