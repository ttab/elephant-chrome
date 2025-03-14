import { Tooltip } from '@ttab/elephant-ui'
import { useMemo } from 'react'

interface TitleProps {
  planningTitle: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  return useMemo(() => (
    <>
      <div className='w-fit'>
        <Tooltip content={planningTitle}>
          <div className='@2xl/view:max-w-[200px] @4xl/view:max-w-[400px] truncate space-x-2 items-center text-muted-foreground'>{planningTitle}</div>
        </Tooltip>
      </div>
      <div>{assignmentTitle}</div>
    </>
  ), [planningTitle, assignmentTitle])
}
