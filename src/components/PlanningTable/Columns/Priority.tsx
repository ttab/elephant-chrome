import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@ttab/elephant-ui'
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
        <div className='flex w-1'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {priority.icon && (
                <priority.icon className='h-6 w-6 text-muted-foreground' color={priority.color} />
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{priority.label}</p>
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
