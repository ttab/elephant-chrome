import { type ColumnDef } from '@tanstack/react-table'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Popover, PopoverTrigger, PopoverContent } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { type Planning } from '../data/schema'

export const assignees: ColumnDef<Planning> = {
  id: 'assignees',
  accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
  cell: ({ row }) => {
    const assignees = row.getValue<string[]>('assignees') || []
    return (
        <div className={cn('flex -space-x-2 w-fit text-xs font-semibold leading-6 h-8 items-center',
          assignees.length > 3 && 'border rounded-full hidden lg:flex')}>
          {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
            const [first, last] = assignee.trim().split(' ')
            const initials = `${first[0]}${last[0]}`
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className='hidden lg:flex w-8 h-8 rounded-full items-center justify-center bg-[#973C9F] text-background dark:text-foreground border'>
                      {initials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{assignee}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
          {assignees.length > 3 && (
            <Popover>
              <PopoverTrigger>
                <span className='font-normal px-3 pt-1'>{assignees.length > 3 && `+${assignees.length - 3}`}</span>
              </PopoverTrigger>
              <PopoverContent>
                {assignees.map((assignee: string, index: number) => {
                  const [first, last] = assignee.trim().split(' ')
                  const initials = `${first[0]}${last[0]}`
                  return (
                    <div key={index} className='flex p-1'>
                      <div className='w-8 h-8 rounded-full flex items-center justify-center border-2 mr-4'>
                        {initials}
                      </div>
                      <p>{assignee}</p>
                    </div>
                  )
                })}
              </PopoverContent>
            </Popover>
          )}
        </div>
    )
  }
}
