import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter, SectionFilter, StatusFilter } from './Items/'
import type { Dispatch, SetStateAction } from 'react'
import type { Facets } from '@/hooks/index/lib/assignments/filterAssignments'

export const GridCommands = ({ page, setPage, setSearch, facets }: {
  page: string
  setPage: Dispatch<SetStateAction<string>>
  setSearch: Dispatch<SetStateAction<string | undefined>>
  facets?: Facets
}): JSX.Element => {
  return (
    <CommandList>
      <StatusFilter page={page} setPage={setPage} setSearch={setSearch} facets={facets?.status} />
      <SectionFilter page={page} setPage={setPage} setSearch={setSearch} facets={facets?.section} />
      <ClearFilter />
    </CommandList>
  )
}
