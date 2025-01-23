import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useFilter } from '@/hooks/useFilter'
import { CommandItem } from '@ttab/elephant-ui'
import { CheckIcon, CircleCheck } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type { Dispatch, SetStateAction } from 'react'

export const StatusFilter = ({ page, setPage }: {
  page: string
  setPage: Dispatch<SetStateAction<string>>
}): JSX.Element | undefined => {
  const [filter, setFilter] = useFilter(['status'])
  const statuses = new Set(filter.status)

  if (!page) {
    return (
      <CommandItem
        onSelect={() => setPage('status')}
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
                console.log('onSelect')
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
            </CommandItem>
          )
        })}
      </>
    )
  }
}

