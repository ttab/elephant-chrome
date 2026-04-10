import { useSession } from 'next-auth/react'
import { decodeJwt } from 'jose'
import { useMemo } from 'react'

/**
 * Returns true if the current user belongs to the given unit.
 * Decodes the access token to read the units claim directly.
 */
export function useHasUnit(unit: string): boolean {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.accessToken) {
      return false
    }

    try {
      const decoded = decodeJwt(session.accessToken)
      const units = Array.isArray(decoded.units) ? decoded.units as string[] : []
      return units.includes(unit)
    } catch {
      return false
    }
  }, [session?.accessToken, unit])
}
