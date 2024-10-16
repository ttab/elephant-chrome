import { Tooltip } from '@ttab/elephant-ui'

interface TitleProps {
  planningTitle: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  return (
    <div className='gap-1 items-center flex'>
      <Tooltip content={planningTitle}>
        <div className='hidden sm:flex truncate space-x-2 items-center text-muted-foreground w-[200px] min-w-[200px] max-w-[200px]'>{planningTitle}</div>
      </Tooltip>
      <Tooltip content={planningTitle}>
        <div className='text-gray-400 opacity-50 w-4 flex-shrink-0'>{'>'}</div>
      </Tooltip>
      <div className='space-x-2 items-center'>{assignmentTitle}</div>
    </div>
  )
}
