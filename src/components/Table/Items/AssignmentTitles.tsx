import { Tooltip } from '@ttab/elephant-ui'
import { useMemo } from 'react'

interface TitleProps {
  planningTitle: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  const usePlanningTitle = planningTitle.trim() !== assignmentTitle.trim()

  return useMemo(() => (
    <>
      <div className='w-fit'>
        <Tooltip content={planningTitle}>
          {usePlanningTitle && (
            <div className='@2xl/view:max-w-[200px] @4xl/view:max-w-[400px] space-x-2 items-center text-muted-foreground'>
              {planningTitle}
            </div>
          )}
        </Tooltip>
      </div>
      <div>{assignmentTitle}</div>
    </>
  ), [planningTitle, assignmentTitle, usePlanningTitle])
}
