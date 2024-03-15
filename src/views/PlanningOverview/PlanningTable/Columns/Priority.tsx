import { type ColumnValueOption } from '@/types'
import {
  Badge,
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent
} from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Priority = ({ priority }: { priority: ColumnValueOption }): JSX.Element => {
  return useMemo(() => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {priority.icon && (
          <Badge
            variant='outline'
            className='rounded-lg px-2 py-1 bg-background'>
            <priority.icon
              color={priority.color}
              className='p-0'
              size={18}
              strokeWidth={1.75}
            />
            <span className='text-muted-foreground text-sm font-sans font-normal'>
              {priority.value}
            </span>
          </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{priority.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ), [priority])
}
