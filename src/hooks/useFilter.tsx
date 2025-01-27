import { useQuery } from './useQuery'

interface Filter {
  [key: string]: string[]
}

export const useFilter = (keys: string[]): [Filter, (arg: Filter) => void] => {
  // Get filter from query
  const [query, setQuery] = useQuery()
  const filter: Filter = keys.reduce((acc, key) => {
    if (query[key]) {
      acc[key] = Array.isArray(query[key]) ? query[key] : [query[key]]
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
