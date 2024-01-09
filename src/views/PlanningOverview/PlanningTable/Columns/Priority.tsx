import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import {
  Badge,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@ttab/elephant-ui'
import { SignalHigh, SignalMedium, SignalLow } from '@ttab/elephant-ui/icons'
import { type ColumnValueOption } from '@/types'

const columnValueOptions: ColumnValueOption[] = [
  {
    value: '6',
    label: '6',
    icon: SignalHigh,
    color: '#FF5050'
  },
  {
    value: '5',
    label: '5',
    icon: SignalHigh,
    color: '#FF5050'
  },
  {
    value: '4',
    label: '4',
    icon: SignalMedium
  },
  {
    value: '3',
    label: '3',
    icon: SignalMedium
  },
  {
    value: '2',
    label: '2',
    icon: SignalLow
  },
  {
    value: '1',
    label: '1',
    icon: SignalLow
  }
]

export const priority: ColumnDef<Planning> = {
  id: 'priority',
  meta: {
    filter: 'facet',
    options: columnValueOptions,
    name: 'Priority',
    icon: SignalHigh
  },
  accessorFn: (data) => data._source['document.meta.core_planning_item.data.priority'][0],
  cell: ({ row }) => {
    const priority = columnValueOptions.find(
      (priority) => {
        return priority.value === row.getValue('priority')
      }
    )
    if (!priority) {
      return null
    }

    return (
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
            <p>{priority.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>)
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  }
}
