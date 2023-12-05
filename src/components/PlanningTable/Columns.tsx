'use client'

import { type ColumnDef } from '@tanstack/react-table'

import {
  Badge,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Popover, PopoverContent, PopoverTrigger
} from '@ttab/elephant-ui'

import { assignmentTypes, sectors, priorities } from './data/data'
import { type Planning } from './data/schema'
import { ColumnHeader } from './ColumnHeader'
import { RowActions } from './RowActions'
import { cn } from '@ttab/elephant-ui/utils'

export const columns: Array<ColumnDef<Planning>> = [
  {
    id: 'title',
    accessorFn: (data) => data._source['document.title'][0],
    header: ({ column }) => (
      <ColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const status = row.original._source['document.meta.core_planning_item.data.public'][0] === 'true'
      const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']

      return (
        <div className="flex space-x-2 w-fit">
          {status && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center bg-[#5895FF] h-2 w-2 rounded-full mx-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Public</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="w-[200px] md:w-[300px] lg:w-[500px] truncate font-medium">
            {row.getValue('title')}
          </span>
          {slugline?.length && (
            <span className='hidden text-medium text-slate-600 lg:block'>{slugline[0]}</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'section',
    accessorFn: (data) => data._source['document.rel.sector.title'][0],
    header: ({ column }) => (
      <ColumnHeader column={column} title="Section" />
    ),
    cell: ({ row }) => {
      const sector = sectors.find((label) => label.value === row.original._source['document.rel.sector.title'][0])

      return sector && <Badge variant="outline">
        <div className={cn('h-2 w-2 rounded-full mr-2', sector?.color) } />
        <span className='text-slate-500 font-medium font-sans'>{sector.label}</span>
      </Badge>
    }
  },
  {
    id: 'priority',
    accessorFn: (data) => data._source['document.meta.core_planning_item.data.priority'][0],
    header: ({ column }) => (
      <ColumnHeader column={column} title="Priority" />
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
                <priority.icon className="mr-2 h-6 w-6 text-muted-foreground" color={priority.color} />
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
    id: 'assignees',
    accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
    header: ({ column }) => (<ColumnHeader column={column} title="Assignees" />),
    cell: ({ row }) => {
      const assignees = row.getValue<string[]>('assignees') || []
      return (
        <div className={cn('flex -space-x-2 w-fit text-sm font-semibold leading-6',
          assignees.length > 3 && 'border-2 rounded-full')}>
          {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
            const [first, last] = assignee.trim().split(' ')
            const initials = `${first[0]}${last[0]}`
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className='w-8 h-8 rounded-full flex items-center stroke-slate-100 justify-center bg-[#973C9F] text-background dark:text-foreground border-2'>
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
                      <div className='w-8 h-8 rounded-full flex items-center stroke-slate-100 justify-center bg-[#973C9F] text-background dark:text-foreground border-2 mx-4'>
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
  },
  {
    id: 'assignmentType',
    accessorFn: (data) => data._source['document.meta.core_assignment.meta.core_assignment_type.value'],
    header: ({ column }) => (
      <ColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const data = assignmentTypes.filter(
        (assignmentType) => row.getValue<string[]>('assignmentType').includes(assignmentType.value)
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
                    <item.icon className="mr-2 h-5 w-5 text-muted-foreground" color='#818FB4' />
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
    cell: ({ row }) => <RowActions row={row} />
  }
]
