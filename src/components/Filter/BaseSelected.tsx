import { useQuery } from '@/hooks/useQuery'
import { CommandItem } from '@ttab/elephant-ui'
import { CheckIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const BaseSelected = ({ options, filterPage, facets }: {
  options: { label: string, value: string }[]
  facets?: Map<string, number>
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
            setFilter({
              ...filter,
              [filterPage]: selected.size === 0
                ? undefined
                : Array.from(selected)
            })
          } else {
            selected.add(option.value)
            setFilter({
              ...filter,
              [filterPage]: Array.from(selected)
            })
          }
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
        <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
          {facets?.get(option.value) && (
            <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
              {facets.get(option.value) || 0}
            </span>
          )}
        </span>
      </CommandItem>
    )
  })
}
