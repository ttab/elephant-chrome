import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import {
  Badge,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@ttab/elephant-ui'
import { priorities } from '../data/settings'

export const priority: ColumnDef<Planning> = {
  id: 'priority',
  accessorFn: (data) => data._source['document.meta.core_planning_item.data.priority'][0],
  cell: ({ row }) => {
    const priority = priorities.find(
      (priority) => {
        return priority.value === row.getValue('priority')
      }
    )
    if (!priority) {
      return null
    }

    return (
        <div className='flex w-1 pr-4'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {priority.icon && (
              <Badge
                variant='outline'
                className='rounded-lg px-2 py-1'>
                  <priority.icon
                    color={priority.color}
                    className='p-0'
                  />
                  <span className='text-muted-foreground text-sm font-sans font-normal'>
                    {priority.value}
                  </span>
              </Badge>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{priority.value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        </div>
    )
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  }
}
