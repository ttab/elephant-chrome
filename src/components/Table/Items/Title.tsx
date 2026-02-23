import { SluglineButton } from '@/components/DataItem/Slugline'
import { cn } from '@ttab/elephant-ui/utils'
import { useMemo, type JSX } from 'react'

export const Title = ({ slugline, title, className, cancelled }: {
  slugline?: string
  title: string
  className?: string
  cancelled?: boolean
}): JSX.Element => {
  return useMemo(() => (
    <div className='flex gap-2 items-center min-w-0'>
      <span
        title={cancelled ? 'Markerad som inställd' : ''}
        className={cn('font-medium text-sm truncate', className, cancelled ? 'text-muted-foreground line-through' : 'no-underline')}
      >
        {title}
      </span>

      <span className='flex-none'>
        <SluglineButton value={slugline} />
      </span>
    </div>
  ), [slugline, title, className, cancelled])
}
