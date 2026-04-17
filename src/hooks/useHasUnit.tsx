import { useSession } from 'next-auth/react'

/**
 * Returns true if the current user belongs to the given unit.
 */
export function useHasUnit(unit: string): boolean {
  const { data: session } = useSession()
  return session?.units?.includes(unit) ?? false
}
