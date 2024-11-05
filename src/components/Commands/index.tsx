import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter, TextFilter, ColumnFilter } from './Items'

export const Commands = (): JSX.Element => {
  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter />
    </CommandList>
  )
}
