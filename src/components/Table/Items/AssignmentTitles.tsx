import { Tooltip } from '@ttab/elephant-ui'
import { useMemo, type JSX } from 'react'

interface TitleProps {
  planningTitle?: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  const showPlanningTitle = planningTitle ? planningTitle.trim() !== assignmentTitle.trim() : false

  return useMemo(() => (
    <>
      {showPlanningTitle && (
        <Tooltip content={planningTitle}>
          <div className='truncate @2xl/view:max-w-[200px] @4xl/view:max-w-[400px] text-muted-foreground'>
            {planningTitle}
          </div>
        </Tooltip>
      )}
      <div className='truncate'>{assignmentTitle}</div>
    </>
  ), [planningTitle, assignmentTitle, showPlanningTitle])
}
