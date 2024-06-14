import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from './Items/ClearFilter'
import { TextFilter } from './Items/TextSearch'
import { ColumnFilter } from './Items/ColumnFilter'
import { ToggleColumn } from './Items/ToggleColumn'

export const CalendarCommands = (): JSX.Element => {
  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter />
      <ToggleColumn />
    </CommandList>
  )
}
