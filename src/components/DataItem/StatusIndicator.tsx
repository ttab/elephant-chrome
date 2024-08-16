import { Tooltip } from '@ttab/elephant-ui'
import { Building, Globe } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const StatusIndicator = ({ data, className }: {
  data: 'internal' | 'public'
  className?: string
}): JSX.Element => {
  return (
    <Tooltip content={data}>
      <div className={cn('items-center', className)}>
        {data === 'internal'
          ? <Building size={18} strokeWidth={1.75} className='text-muted-foreground' />
          : <Globe size={18} strokeWidth={1.75} className='text-muted-foreground' />
        }
      </div>

    </Tooltip>
  )
}
