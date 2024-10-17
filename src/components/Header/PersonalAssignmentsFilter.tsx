import { useTable } from '@/hooks/useTable'
import { Button } from '@ttab/elephant-ui'
import { User } from '@ttab/elephant-ui/icons'


interface PAFProps {
  assigneeUserName: string
}

export const PersonalAssignmentsFilter = ({ assigneeUserName }: PAFProps): JSX.Element => {
  const { table } = useTable()

  return (
    <Button
      variant='outline'
      onClick={() => {
        table.setColumnFilters(prev => {
          const isColumnFiltered = prev.find(column => column.id === 'assignees')
          if (isColumnFiltered) {
            return prev.filter(column => column.id !== 'assignees')
          }
          if (!isColumnFiltered) {
            return prev.concat([{ id: 'assignees', value: [assigneeUserName] }])
          }
          return prev
        })
      }}
    >
      <User size={18} strokeWidth={1.75} className='shrink-0 mr-2' />
      Mina uppdrag
    </Button>
  )
}
