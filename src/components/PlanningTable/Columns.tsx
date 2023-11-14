'use client'

import { type ColumnDef } from '@tanstack/react-table'

import { Badge, Checkbox, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@ttab/elephant-ui'

import { assignmentTypes, sectors, priorities } from './data/data'
import { type Planning } from './data/schema'
import { DataTableColumnHeader } from './ColumnHeader'
import { DataTableRowActions } from './RowActions'

export const columns: Array<ColumnDef<Planning>> = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    id: 'title',
    accessorFn: (data) => data._source['document.title'][0],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const sector = sectors.find((label) => label.value === row.original._source['document.rel.sector.title'][0])

      return (
        <div className="flex space-x-2">
          {sector && <Badge variant="outline">{sector.label}</Badge>}
          <span className="max-w-[300px] truncate font-medium">
            {row.getValue('title')}
          </span>
        </div>
      )
    }
  },
  {
    id: 'assignees',
    accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
    header: ({ column }) => (<DataTableColumnHeader column={column} title="Assignees" />),
    cell: ({ row }) => {
      const assignees = row.original._source['document.meta.core_assignment.rel.assignee.name']

      return (
        <div className='flex -space-x-3 hover:-space-x-0 w-[150px] font-mono text-xs leading-6'>
          {(assignees || []).map((assignee: string, index: number) => {
            const [first, last] = assignee.trim().split(' ')
            const initials = `${first[0]}${last[0]}`
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className='w-6 h-6 rounded-full flex items-center justify-center bg-muted border hover:border-black shadow-sm'>
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
        </div>
      )
    }
  },
  {
    id: 'priority',
    accessorFn: (data) => data._source['document.meta.core_planning_item.data.priority'][0],
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {priority.icon && (
                <priority.icon className="mr-2 h-6 w-6 text-muted-foreground" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{priority.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'assignmentType',
    accessorFn: (data) => {
      return data._source['document.meta.core_assignment.meta.core_assignment_type.value']
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const data = assignmentTypes.filter(
        (assignmentType) => row.getValue('assignmentType').includes(assignmentType.value)
      )
      if (data.length === 0) {
        return null
      }

      return (
        <div className="flex items-center">
          {data.map((item, index) => {
            return item.icon && (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <item.icon className="mr-2 h-6 w-6 text-muted-foreground" />
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
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />
  }
]
