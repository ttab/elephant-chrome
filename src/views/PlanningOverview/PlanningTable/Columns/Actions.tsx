import { useMemo } from 'react'
import { MoreHorizontal as DotsHorizontalIcon } from '@ttab/elephant-ui/icons'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'
import { Link } from '../../../../components'


export const Actions = ({ deliverableUuids }: { deliverableUuids: string[] }): JSX.Element => {
  return useMemo(() => (
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
                <Link to='Editor' props={{ id: uuid }}>
                  {uuid}
                </Link>
              </DropdownMenuItem>
            )
          })
          : 'No deliverables'
          }
      </DropdownMenuContent>
    </DropdownMenu>
  ), [deliverableUuids])
}
