import React from 'react'
import { useTable } from '@/hooks/useTable'
import { CommandList } from '@ttab/elephant-ui'
import type { CmdProps } from '@/components/CommandMenu'
import { ClearFilter } from './Items/ClearFilter'
import { TextFilter } from './Items/TextSearch'
import { ColumnFilter } from './Items/ColumnFilter'
import { ToggleColumn } from './Items/ToggleColumn'

export const PlanningCommands: React.FC<CmdProps> = ({ pages, setPages, page, setSearch }) => {
  const { table } = useTable()

  return (
    <CommandList>
      <TextFilter pages={pages} setPages={setPages} page={page} setSearch={setSearch} table={table} />
      <ColumnFilter table={table} page={page} pages={pages} setPages={setPages} setSearch={setSearch}/>
      <ClearFilter table={table} />
      <ToggleColumn table={table} page={page} pages={pages} setPages={setPages} setSearch={setSearch}/>
    </CommandList>
  )
}
