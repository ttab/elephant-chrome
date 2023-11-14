'use client'

import { MoreHorizontal as DotsHorizontalIcon } from '@ttab/elephant-ui/icons'
import { type Row } from '@tanstack/react-table'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { Link } from '..'


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row
}: DataTableRowActionsProps<TData>): JSX.Element {
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
        {row.original._source?.['document.meta.core_assignment.rel.deliverable.uuid']
          ? row.original._source?.['document.meta.core_assignment.rel.deliverable.uuid'].map((uuid) => {
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
