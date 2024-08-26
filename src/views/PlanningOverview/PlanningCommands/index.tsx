import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter, TextFilter, ColumnFilter } from '@/components/Commands/Items'

export const PlanningCommands = (): JSX.Element => {
  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter />
    </CommandList>
  )
}
