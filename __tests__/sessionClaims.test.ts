import { describe, it, expect } from 'vitest'
import { claimsFromAccessToken } from '@/shared/sessionClaims'

/**
 * `units` and the full `org` URI are TT claims on the access token, and
 * `@ttab/tt-session` carries neither over the wire — the token endpoint answers
 * `{accessToken, expiresAt, subject, impersonating, scope}` and
 * `SessionPrincipal.customerId` is only `org`'s last path segment, which
 * `getContentSourceLink()` does not match on. So this decode is load-bearing.
 */
const b64 = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

/**
 * Built by hand rather than signed: `decodeJwt` reads the payload and never
 * verifies, so a signature would be theatre — and signing would drag WebCrypto
 * into a test about parsing.
 */
function token(claims: Record<string, unknown>): string {
  const header = b64({ alg: 'RS256', typ: 'JWT' })
  const payload = b64({ sub: 'core://user/5558', ...claims })

  return `${header}.${payload}.signature-not-verified`
}

describe('claimsFromAccessToken', () => {
  it('reads units and org off the access token', () => {
    const claims = claimsFromAccessToken(token({
      units: ['/redaktionen-npk', '/redaktionen'],
      org: 'core://org/tt'
    }))

    expect(claims.units).toEqual(['/redaktionen-npk', '/redaktionen'])
    expect(claims.org).toBe('core://org/tt')
  })

  it('keeps the whole org URI, not just the last segment', () => {
    // `SessionPrincipal.customerId` would be `ntb` here, and
    // `getContentSourceLink()` matches `core://org/ntb`.
    const claims = claimsFromAccessToken(token({ org: 'core://org/ntb' }))

    expect(claims.org).toBe('core://org/ntb')
  })

  it('defaults when the claims are absent', () => {
    const claims = claimsFromAccessToken(token({}))

    expect(claims).toEqual({ units: [], org: '' })
  })

  it('defaults when the claims are the wrong shape', () => {
    const claims = claimsFromAccessToken(token({ units: 'not-an-array', org: 42 }))

    expect(claims).toEqual({ units: [], org: '' })
  })

  it('defaults on an opaque token rather than throwing', () => {
    // Exactly what `fakeKeycloak` issues, and what a non-JWT realm would.
    expect(claimsFromAccessToken('access-a1b2c3d4')).toEqual({ units: [], org: '' })
  })

  it('defaults on a missing token', () => {
    expect(claimsFromAccessToken(undefined)).toEqual({ units: [], org: '' })
    expect(claimsFromAccessToken(null)).toEqual({ units: [], org: '' })
    expect(claimsFromAccessToken('')).toEqual({ units: [], org: '' })
  })
})
