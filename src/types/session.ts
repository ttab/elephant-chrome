/**
 * The session as elephant-chrome consumes it.
 *
 * `@ttab/tt-session` splits the session across two endpoints — the token
 * endpoint carries `{accessToken, expiresAt, subject, impersonating, scope}` and
 * the identity endpoint carries the principal — and deliberately keeps `units`
 * and the full `org` URI out of both. This is the composed shape, assembled in
 * `SessionContext`; the fields match what the call sites already read.
 */

export interface SessionUser {
  /** Keycloak `sub`. The stable identity key. */
  sub: string
  /** Same value as `sub`; kept because call sites and `Avatar` read both. */
  id: string
  name: string
  email: string
  image: string
}

export interface ImpersonatedIdentity {
  sub: string
  name?: string
  email?: string
  preferredUsername?: string
  customerId?: string
  isCustomerAdmin: boolean
  startedAt: number
  /** The hard cap, absolute ms epoch. */
  expiresAt: number
}

export interface Session {
  accessToken: string
  /** Absolute ms epoch, never a duration. */
  accessTokenExpires: number
  user: SessionUser
  /** From the access token's `units` claim. */
  units: string[]
  /** From the access token's `org` claim, e.g. `core://org/tt`. */
  org: string
  roles: string[]
  isAdmin: boolean
  scope: string
  /**
   * The live impersonation, or `null`. An object rather than a boolean, so
   * `if (session.impersonating)` is right but `=== true` is not.
   */
  impersonating: ImpersonatedIdentity | null
}
