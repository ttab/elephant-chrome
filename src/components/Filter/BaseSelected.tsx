import { useQuery } from '@/hooks/useQuery'
import { CommandItem } from '@ttab/elephant-ui'
import { CheckIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const BaseSelected = ({ options, filterPage }: {
  options: { label: string, value: string }[]
  filterPage: string
}) => {
  const [filter, setFilter] = useQuery([filterPage])
  const selected = new Set(filter[filterPage])
  return options.map((option) => {
    const isSelected = selected?.has?.(option.value)

    return (
      <CommandItem
        className='flex gap-1 items-center'
        key={option.value}
        onSelect={() => {
          if (isSelected) {
            selected.delete(option.value)
          } else {
            selected.add(option.value)
          }

          setFilter({ ...filter, [filterPage]: Array.from(selected) })
        }}
      >
        <div
          className={cn(
            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'opacity-50 [&_svg]:invisible'
          )}
        >
          <CheckIcon size={18} strokeWidth={1.75} />
        </div>
        <span>{option.label}</span>
      </CommandItem>
    )
  })
}
