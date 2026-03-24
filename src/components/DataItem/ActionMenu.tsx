import { Link } from '..'
import { MoreHorizontalIcon } from '@ttab/elephant-ui/icons'
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
import { useRef, type JSX } from 'react'
import { useDocumentActivities } from '@/lib/documentActivity'

let lastActionMenuSelectTime = 0

/**
 * Returns true if a dropdown action menu item was selected very recently.
 * Used by the table row click handler to ignore phantom clicks caused by
 * Radix DropdownMenu portal unmounting between pointerdown and pointerup.
 */
export function isActionMenuBusy(): boolean {
  return Date.now() - lastActionMenuSelectTime < 200
}

export const ActionMenu = ({ deliverableUuids, planningId, docType }: {
  deliverableUuids: string[]
  planningId: string
  docType: string
}): JSX.Element => {
  const activities = useDocumentActivities(docType, planningId)
  const shiftRef = useRef(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2'
          data-row-action
        >
          <MoreHorizontalIcon size={18} strokeWidth={1.75} />
          <span className='sr-only'>Open</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        {activities.map((activity) => (
          <DropdownMenuItem
            key={activity.activityId}
            onPointerUp={(e) => {
              shiftRef.current = e.shiftKey
            }}
            onSelect={() => {
              // TODO: This feels hackish, is this really a bug in radix?
              lastActionMenuSelectTime = Date.now()
              void activity.execute({ target: shiftRef.current ? 'last' : undefined })
              shiftRef.current = false
            }}
          >
            {activity.title}
          </DropdownMenuItem>
        ))}
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
              : 'No deliverables'}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
