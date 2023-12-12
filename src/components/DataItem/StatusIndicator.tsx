import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@ttab/elephant-ui'

import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

export const StatusIndicator = ({ internal }: { internal: boolean }): JSX.Element => {
  const status = cva('flex items-center h-2 w-2 rounded-full mx-4', {
    variants: {
      internal: {
        true: 'border',
        false: 'bg-[#5895FF]'
      }
    }
  })

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn(
            status({ internal })
          )} />
        </TooltipTrigger>

        <TooltipContent>
          <p>{internal ? 'Internal' : 'Public'}</p>
        </TooltipContent>

      </Tooltip>
    </TooltipProvider>
  )
}
