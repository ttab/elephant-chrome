import type { QueryParams } from './useQuery'
import { useQuery } from './useQuery'
import { useUserTracker } from './useUserTracker'

interface Filter {
  [key: string]: string[]
}

export const useFilter = (keys: string[]): [Filter, (arg: Filter) => void, boolean] => {
  // Get filter from query
  const [query, setQuery] = useQuery()
  // Only used in approvals right now
  const [savedFilters,, synced] = useUserTracker<QueryParams | undefined>(`filters.Approvals`)
  const filtersWithPrecedence = Object.keys(query || {}).length > 0
    ? query
    : savedFilters || {}

  const filter: Filter = keys.reduce((acc, key) => {
    if (filtersWithPrecedence[key]) {
      const value = filtersWithPrecedence[key]
      acc[key] = Array.isArray(value) ? value.filter((v): v is string => v !== undefined) : [value].filter((v): v is string => v !== undefined)
    }
    return acc
  }, {} as Filter)

  const updateFilter = (newvalue: Filter) => {
  // Set empty keys to undefined
    const cleanedValue = Object.fromEntries(
      Object.entries(newvalue).map(([key, value]) => [key, value.length > 0 ? value : undefined])
    )

    setQuery(cleanedValue)
  }

  return [filter, updateFilter, synced]
}
