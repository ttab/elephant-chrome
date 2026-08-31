import { decodeJwt } from 'jose'

/**
 * TT-specific claims elephant-chrome reads off the access token.
 *
 * `@ttab/tt-session` deliberately keeps its wire payloads minimal — the token
 * endpoint answers `{accessToken, expiresAt, subject, impersonating, scope}`
 * and the identity endpoint answers a `SessionPrincipal`, neither of which
 * carries `units` or the full `org` URI. `SessionPrincipal.customerId` is only
 * the last path segment of `org` (`core://org/tt` -> `tt`), and
 * `getContentSourceLink()` matches on the whole URI, so the segment is not a
 * substitute.
 *
 * Reading them here is not a disclosure: the browser already holds the access
 * token, so every claim in it is readable there regardless.
 */
export interface SessionClaims {
  units: string[]
  org: string
}

const EMPTY: SessionClaims = { units: [], org: '' }

export function claimsFromAccessToken(accessToken: string | undefined | null): SessionClaims {
  if (!accessToken) {
    return EMPTY
  }

  try {
    const decoded = decodeJwt(accessToken)

    return {
      units: Array.isArray(decoded.units) ? decoded.units as string[] : [],
      org: typeof decoded.org === 'string' ? decoded.org : ''
    }
  } catch {
    // A token we cannot decode is not a reason to fail the request: the claims
    // are defaults elsewhere too, and the token itself is still verified by
    // whichever service it is presented to.
    return EMPTY
  }
}
