import { useFilter } from '@/hooks/useFilter'
import { CommandItem } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'

export const ClearFilter = (): JSX.Element | null => {
  const [filters, setFilters] = useFilter(['status', 'section'])
  const hasFilter = Object.values(filters).some((value) => value.length)

  return hasFilter
    ? (
        <CommandItem
          onSelect={() => {
            setFilters({})
          }}
        >
          <X size={18} strokeWidth={1.75} />
          Rensa filter
        </CommandItem>
      )
    : null
}
