import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { Link } from '@/components'
import { useMemo } from 'react'

interface TitleProps {
  internal: boolean
  slugline: string
  title: string
  planningId: string
}

export const Title = ({ internal, slugline, title, planningId }: TitleProps): JSX.Element => {
  return useMemo(() => (
    <div className='flex space-x-2 justify-start'>
      <StatusIndicator internal={internal} />

      <span className='truncate font-medium'>
        <Link to='Planning' props={{ id: planningId }}>
          {title}
        </Link>
      </span>

      {!!slugline?.length && (
        <span className='hidden font-medium text-slate-500 @2xl/view:[display:revert]'>
          {slugline}
        </span>
      )}
    </div>
  ), [internal, slugline, title, planningId])
}
