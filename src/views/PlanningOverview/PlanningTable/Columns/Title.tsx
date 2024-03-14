import { SluglineButton } from '@/components/DataItem/Slugline'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { useMemo } from 'react'

interface TitleProps {
  internal: boolean
  slugline: string
  title: string
}

export const Title = ({ internal, slugline, title }: TitleProps): JSX.Element => {
  return useMemo(() => (
    <div className='flex space-x-2 justify-start items-center'>
      <StatusIndicator internal={internal} />

      <span className='truncate font-medium'>
        {title}
      </span>

      {!!slugline?.length && (
      <span className='hidden font-medium text-slate-500 @2xl/view:[display:revert]'>
        <SluglineButton value={slugline} />
      </span>
      )}

    </div>
  ), [internal, slugline, title])
}
