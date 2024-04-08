import { type DefaultValueOption } from '@/types'
import {
  Badge,
  Tooltip
} from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Priority = ({ priority }: { priority: DefaultValueOption }): JSX.Element => {
  return useMemo(() => (
    <Tooltip content={priority.label}>
      {priority.icon && (
      <Badge
        variant='outline'
        className='rounded-lg px-1 sm:px-2 py-1 bg-background w-5 sm:w-10 h-7'>
        <priority.icon
          size={16}
          strokeWidth={2}
          color={priority.color}
          className='p-0 hidden sm:block'
        />
        <span className='text-muted-foreground text-sm font-sans font-normal'>
          {priority.value}
        </span>
      </Badge>
      )}
    </Tooltip>
  ), [priority])
}
