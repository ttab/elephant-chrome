import { type DefaultValueOption } from '@/types'
import {
  Badge,
  Tooltip
} from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Newsvalue = ({ newsvalue }: { newsvalue: DefaultValueOption }): JSX.Element => {
  return useMemo(() => (
    <Tooltip content={newsvalue.label}>
      {newsvalue.icon && (
        <Badge
          variant='outline'
          className='rounded-lg px-1 sm:px-2 py-1 bg-background w-5 sm:w-10 h-7'>
          <newsvalue.icon
            {...newsvalue.iconProps}
            size={16}
            strokeWidth={2}
            className='p-0 hidden sm:block'
          />
          <span className='text-muted-foreground text-sm font-sans font-normal'>
            {newsvalue.value}
          </span>
        </Badge>
      )}
    </Tooltip>
  ), [newsvalue])
}
