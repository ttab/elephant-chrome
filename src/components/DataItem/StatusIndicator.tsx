import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@ttab/elephant-ui'
import { Building, Globe } from '@ttab/elephant-ui/icons'

export const StatusIndicator = ({ internal }: { internal: boolean }): JSX.Element => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className='items-center'>
            {internal
              ? <Building size={18} strokeWidth={1.75} className='text-muted-foreground' />
              : <Globe size={18} strokeWidth={1.75} className='text-muted-foreground' />
            }
          </div>
        </TooltipTrigger>

        <TooltipContent>
          <p>{internal ? 'Internal' : 'Public'}</p>
        </TooltipContent>

      </Tooltip>
    </TooltipProvider>
  )
}
