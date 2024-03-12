import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@ttab/elephant-ui'
import { Avatar } from '@/components'
import { AvatarGroup } from '../AvatarGroup'

export const AssigneeAvatars = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return (
    <AvatarGroup size="sm">
      {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar value={assignee} size="sm" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{assignee}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}

      {assignees.length > 3 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='font-semibold text-muted-foreground px-4 pt-1'>{assignees.length > 3 && `+${assignees.length - 3}`}</span>
            </TooltipTrigger>
            <TooltipContent>
              {assignees.map((assignee, index) => {
                return (
                  <div key={index} className='flex p-1 text-xs font-semibold leading-7 items-center'>
                    <Avatar variant="muted" size="sm" value={assignee} className='mr-4' />
                    <p>{assignee}</p>
                  </div>)
              })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>)
      }
    </AvatarGroup>
  )
}
