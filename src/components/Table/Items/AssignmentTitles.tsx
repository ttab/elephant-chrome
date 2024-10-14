interface TitleProps {
  planningTitle: string
  assignmentTitle: string
}

export const AssignmentTitles = ({ planningTitle, assignmentTitle }: TitleProps): JSX.Element => {
  return (
    <div className='gap-1 items-center flex'>
      <div className='truncate space-x-2 items-center text-muted-foreground w-[200px] min-w-[200px] max-w-[200px]'>{planningTitle}</div>
      <div className='text-gray-400 opacity-50 w-4 flex-shrink-0'>{'>'}</div>
      <div className='space-x-2 items-center'>{assignmentTitle}</div>
    </div>
  )
}
