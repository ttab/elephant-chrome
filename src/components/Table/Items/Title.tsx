import { SluglineButton } from '@/components/DataItem/Slugline'
import { cn } from '@ttab/elephant-ui/utils'
import { useMemo } from 'react'

export const Title = ({ slugline, title, className }: {
  slugline?: string
  title: string
  className?: string
}): JSX.Element => {
  return useMemo(() => (
    <div className='truncate space-x-2 justify-start items-center'>
      <span className={cn('font-medium text-sm', className)}>
        {title}
      </span>

      <span className=''>
        <SluglineButton value={slugline} />
      </span>
    </div>
  ), [slugline, title, className])
}
