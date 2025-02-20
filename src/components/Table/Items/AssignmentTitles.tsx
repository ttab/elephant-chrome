import { Tooltip } from '@ttab/elephant-ui'
import { useMemo } from 'react'

interface TitleProps {
  planningTitle: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  return useMemo(() => (
    <div className='gap-1 items-center flex'>
      <div className='sm:flex'>
        <Tooltip content={planningTitle}>
          <div className='w-[200px] min-w-[200px] max-w-[200px] truncate space-x-2 items-center text-muted-foreground'>{planningTitle}</div>
        </Tooltip>
      </div>
      <Tooltip content={planningTitle}>
        <div className='text-gray-400 opacity-50 w-4 flex-shrink-0'>{'>'}</div>
      </Tooltip>
      <div className='space-x-2 items-center'>{assignmentTitle}</div>
    </div>
  ), [planningTitle, assignmentTitle])
}
