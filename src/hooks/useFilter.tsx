import { useQuery } from './useQuery'

export interface Filter {
  [key: string]: string[]
}
/*
 * @deprecated use useQuery instead
*/
export const useFilter = (keys: string[]): [Filter, (arg: Filter) => void] => {
  // Get filter from query
  const [query, setQuery] = useQuery()
  // Only used in approvals right now

  const filter: Filter = keys.reduce((acc, key) => {
    if (query[key]) {
      const value = query[key]
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

  return [filter, updateFilter]
}
