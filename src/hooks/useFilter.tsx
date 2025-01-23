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
    // Remove empty keys
    const cleanedValue = Object.fromEntries(Object.entries(newvalue).filter(([_, v]) => v.length > 0))
    setQuery(cleanedValue)
  }

  return [filter, updateFilter]
}
