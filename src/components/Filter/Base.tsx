import { CommandItem } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import type { FilterProps } from '.'

export const Base = ({ pages, setPages, setSearch, label, Icon, filterPage }: {
  label: string
  filterPage: string
  Icon: LucideIcon
} & FilterProps): JSX.Element => (
  <CommandItem
    onSelect={() => {
      setPages([...pages, filterPage])
      setSearch('')
    }}
    className='flex gap-1 items-center'
  >
    <Icon size={18} strokeWidth={1.75} />
    {label}
  </CommandItem>
)
