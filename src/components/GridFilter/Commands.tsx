import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter, SectionFilter, StatusFilter } from './Items/'
import type { Dispatch, SetStateAction } from 'react'

export const GridCommands = ({ page, setPage, setSearch }: {
  page: string
  setPage: Dispatch<SetStateAction<string>>
  setSearch: Dispatch<SetStateAction<string | undefined>>
}): JSX.Element => {
  return (
    <CommandList>
      <StatusFilter page={page} setPage={setPage} setSearch={setSearch} />
      <SectionFilter page={page} setPage={setPage} setSearch={setSearch} />
      <ClearFilter />
    </CommandList>
  )
}
