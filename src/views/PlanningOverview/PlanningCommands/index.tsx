import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter, TextFilter, ColumnFilter, ToggleColumn } from '@/components/Commands/Items'

export const PlanningCommands = (): JSX.Element => {
  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter />
      <ToggleColumn />
    </CommandList>
  )
}
