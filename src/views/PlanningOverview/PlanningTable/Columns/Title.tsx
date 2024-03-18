import { SluglineButton } from '@/components/DataItem/Slugline'
import { useMemo } from 'react'

interface TitleProps {
  slugline: string
  title: string
}

export const Title = ({ slugline, title }: TitleProps): JSX.Element => {
  return useMemo(() => (
    <div className='flex space-x-2 justify-start items-center'>
      <span className='truncate font-medium text-sm'>
        {title}
      </span>

      {!!slugline?.length && (
      <span className='hidden font-medium text-slate-500 @2xl/view:[display:revert]'>
        <SluglineButton value={slugline} />
      </span>
      )}

    </div>
  ), [slugline, title])
}
