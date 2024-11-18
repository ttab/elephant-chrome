import { SluglineButton } from '@/components/DataItem/Slugline'
import { useMemo } from 'react'

export const Title = ({ slugline, title }: {
  slugline?: string
  title: string
}): JSX.Element => {
  return useMemo(() => (
    <div className='truncate space-x-2 justify-start items-center'>
      <span className='font-medium text-sm'>
        {title}
      </span>

      <span className=''>
        <SluglineButton value={slugline} />
      </span>
    </div>
  ), [slugline, title])
}
