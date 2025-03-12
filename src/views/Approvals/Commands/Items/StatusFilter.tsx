import type { FilterProps } from '@/components/Filter'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useQuery } from '@/hooks/useQuery'
import { CommandItem } from '@ttab/elephant-ui'
import { CheckIcon, CircleCheck } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const StatusFilter = ({ page, pages, setPages, setSearch, facets }: {
  facets?: Map<string, number>
} & FilterProps): JSX.Element | undefined => {
  const [filter, setFilter] = useQuery(['status'])
  const statuses = new Set(filter.status)

  if (!page) {
    return (
      <CommandItem
        onSelect={() => {
          setSearch('')
          setPages([...pages, 'status'])
        }}
        className='flex gap-1 items-center'
      >
        <CircleCheck size={18} strokeWidth={1.75} />
        Status
      </CommandItem>
    )
  }

  if (page === 'status') {
    return (
      <>
        {DocumentStatuses.map((status) => {
          const isSelected = statuses?.has?.(status.value)

          return (
            <CommandItem
              className='flex gap-1 items-center'
              key={status.value}
              onSelect={() => {
                if (isSelected) {
                  statuses.delete(status.value)
                } else {
                  statuses.add(status.value)
                }

                setFilter({ ...filter, status: Array.from(statuses) })
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
              {status.icon && (
                <status.icon size={18} strokeWidth={1.75} />
              )}
              <span>{status.label}</span>
              <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                {facets?.get(status.value) && (
                  <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                    {facets.get(status.value) || 0}
                  </span>
                )}
              </span>
            </CommandItem>
          )
        })}
      </>
    )
  }
}

