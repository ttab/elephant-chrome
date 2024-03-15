import { Link } from '..'
import { MoreHorizontal } from '@ttab/elephant-ui/icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

export function ActionMenu({ deliverableUuids, planningId }: { deliverableUuids: string[], planningId: string }): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
          <span className="sr-only">Open</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuItem>
          <Link to='Planning' props={{ id: planningId }}>
            Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Assignments</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
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
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
