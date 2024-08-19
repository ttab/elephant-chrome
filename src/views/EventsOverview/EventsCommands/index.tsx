import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Commands/Items/ClearFilter'
import { TextFilter } from '@/components/Commands/Items/TextFilter'
import { ColumnFilter } from '@/components/Commands/Items/ColumnFilter'

export const EventsCommands = (): JSX.Element => {
  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter />
    </CommandList>
  )
}
