import { MoreHorizontal as DotsHorizontalIcon, Navigation } from '@ttab/elephant-ui/icons'
import { type ColumnDef } from '@tanstack/react-table'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { Link } from '../../../../components'
import { type Planning } from '../data/schema'


export const actions: ColumnDef<Planning> = {
  id: 'action',
  meta: {
    filter: null,
    name: 'Action',
    icon: Navigation
  },
  cell: ({ row }) => {
    const deliverableUuids = row.original._source['document.meta.core_assignment.rel.deliverable.uuid'] || []
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          {deliverableUuids.length
            ? deliverableUuids.map((uuid) => {
              return (
                <DropdownMenuItem key={uuid}>
                  <Link to='Editor' props={{ documentId: uuid }}>
                    {uuid}
                  </Link>
                </DropdownMenuItem>
              )
            })
            : 'No deliverables'
          }
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
}
