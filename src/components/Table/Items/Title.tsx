import { SluglineButton } from '@/components/DataItem/Slugline'
import { cn } from '@ttab/elephant-ui/utils'
import { useMemo } from 'react'

export const Title = ({ slugline, title, className, cancelled }: {
  slugline?: string
  title: string
  className?: string
  cancelled?: boolean
}): JSX.Element => {
  return useMemo(() => (
    <div className='truncate space-x-2 justify-start items-center'>
      <span
        title={cancelled ? 'Markerad som inställd' : ''}
        className={cn('font-medium text-sm', className, cancelled && cancelled ? 'text-muted-foreground line-through' : 'text-black no-underline')}
      >
        {title}
      </span>

      <span className=''>
        <SluglineButton value={slugline} />
      </span>
    </div>
  ), [slugline, title, className, cancelled])
}
