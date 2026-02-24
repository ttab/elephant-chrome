import { useMemo } from 'react'
import { useQuery } from '@/hooks/useQuery'
import { useRegistry } from '@/hooks/useRegistry'
import { getUTCDateRange } from '@/shared/datetime'

export function useDateRange(): { from: string, to: string } {
  const [query] = useQuery()
  const { timeZone } = useRegistry()

  return useMemo(() =>
    getUTCDateRange(
      query?.from ? new Date(query.from as string) : new Date(),
      timeZone
    ), [query, timeZone])
}
