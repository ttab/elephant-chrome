import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
  Popover, PopoverTrigger, PopoverContent
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

const AssigneePopover = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return assignees.length > 3
    ? (
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
                <div className='w-8 h-8 rounded-full flex items-center justify-center border-2 mr-4'>
                  {initials}
                </div>
                <p>{assignee}</p>
              </div>
            )
          })}
        </PopoverContent>
      </Popover>)
    : <></>
}

export const AssigneeAvatars = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return (
    <div className={cn('flex -space-x-2 w-fit text-xs font-semibold leading-6 h-8 items-center',
      assignees.length > 3 && 'border rounded-full hidden lg:flex')}>
      {(assignees || []).slice(0, 3).map((assignee: string, index: number) => {
        const [first, last] = assignee.trim().split(' ')
        const initials = `${first[0]}${last[0]}`
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <div className='hidden lg:flex w-8 h-8 rounded-full items-center justify-center bg-background text-muted-foreground border'>
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
      <AssigneePopover assignees={assignees} />
    </div>
  )
}
