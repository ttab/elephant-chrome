import { CommandItem } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'

export const ClearFilter = ({ hasFilter, onClear }: {
  hasFilter: boolean
  onClear: () => void
}): JSX.Element | null => {
  return hasFilter
    ? (
        <CommandItem
          onSelect={onClear}
        >
          <X size={18} strokeWidth={1.75} />
          Rensa filter
        </CommandItem>
      )
    : null
}
