import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@ttab/elephant-ui'
import { AssignmentTypes } from '@/defaults'
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import {
  Crosshair,
  FileType,
  Image,
  Camera,
  Video
} from '@ttab/elephant-ui/icons'
import { type ColumnValueOption } from '@/types'

const columnValueOptions: ColumnValueOption[] = [
  {
    label: 'Text',
    value: 'text',
    icon: FileType
  },
  {
    label: 'Graphic',
    value: 'graphic',
    icon: Image
  },
  {
    label: 'Picture',
    value: 'picture',
    icon: Camera
  },
  {
    label: 'Video',
    value: 'video',
    icon: Video
  }
]
export const type: ColumnDef<Planning> = {
  id: 'type',
  meta: {
    filter: 'facet',
    options: columnValueOptions,
    name: 'Type',
    columnIcon: Crosshair,
    className: 'box-content w-[120px] hidden @6xl/view:[display:revert]'
  },
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
  filterFn: 'arrIncludesSome'
}
