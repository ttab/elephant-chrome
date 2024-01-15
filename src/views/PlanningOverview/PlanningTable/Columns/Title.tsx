import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { useMemo } from 'react'

export const Title = ({ internal, slugline, title }: any): JSX.Element => {
  return useMemo(() => (
    <div className='flex space-x-2 w-fit'>
      <StatusIndicator internal={internal} />

      <span className='max-w-[200px] md:max-w-[300px] lg:max-w-[700px] truncate font-medium'>
        {title}
      </span>

      {!!slugline?.length && (
      <span className='hidden font-medium text-slate-500 lg:block'>{slugline[0]}</span>
      )}
    </div>), [internal, slugline, title])
}
