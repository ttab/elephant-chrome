import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@ttab/elephant-ui'
import { AssignmentTypes } from '@/defaults'
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'

export const type: ColumnDef<Planning> = {
  id: 'type',
  accessorFn: (data) => data._source['document.meta.core_assignment.meta.core_assignment_type.value'],
  cell: ({ row }) => {
    const data = AssignmentTypes.filter(
      (assignmentType) => row.getValue<string[]>('type').includes(assignmentType.value)
    )
    if (data.length === 0) {
      return null
    }

    return (
      <div className='flex items-center'>
        {data.map((item, index) => {
          return item.icon && (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger>
                  <item.icon className='mr-2 h-5 w-5 text-muted-foreground' color='#818FB4' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    )
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  }
}
