import { SluglineButton } from '@/components/DataItem/Slugline'
import { useMemo } from 'react'

interface TitleProps {
  slugline: string
  title: string
}

export const Title = ({ slugline, title }: TitleProps): JSX.Element => {
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
