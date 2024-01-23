import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { Avatar } from '@/components'

export const AssigneeAvatars = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return (
    <div className={cn('flex -space-x-2 w-fit leading-7 h-8 items-center',
      assignees.length > 3 && 'rounded-full')}
    >
      {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar value={assignee} variant="muted" />
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
                    <Avatar size="sm" value={assignee} className='mr-4' />
                    <p>{assignee}</p>
                  </div>)
              })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>)
      }
    </div>
  )
}
