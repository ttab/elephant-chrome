import { type SetStateAction, useMemo } from 'react'
import { ComboBox, type DefaultValueOption } from '@ttab/elephant-ui'
import { useQuery } from '@/hooks/useQuery'
import { useTable } from '@/hooks/useTable'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'

interface SearchTypeItem {
  value: SearchKeys
  label: string
}

type SearchTypes = Array<SearchTypeItem>
interface DropdownProps {
  searchType: 'plannings' | 'events' | 'assignments' | 'articles'
  setSearchType: React.Dispatch<SetStateAction<SearchKeys>>
}

export const searchTypes: SearchTypes = [
  { value: 'plannings', label: 'Planeringar' },
  { value: 'events', label: 'Händelser' },
  { value: 'articles', label: 'Artiklar' }
]

export const SearchDropdown = ({ searchType, setSearchType }: DropdownProps) => {
  const selected = useMemo(() => searchTypes.filter((p: SearchTypeItem) => p.value === searchType), [searchType])
  const [, setQueryString] = useQuery()
  const { setData } = useTable<unknown>()

  return (
    <ComboBox
      selectedOptions={selected}
      placeholder={searchTypes.find((p) => p.value === searchType)?.label}
      max={1}
      options={searchTypes}
      onSelect={(e: DefaultValueOption) => {
        setData([])
        setSearchType(e.value as SearchKeys)
        setQueryString({ type: e.value })
      }}
    />
  )
}
