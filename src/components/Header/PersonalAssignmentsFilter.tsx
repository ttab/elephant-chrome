import { useTable } from '@/hooks/useTable'
import { Button } from '@ttab/elephant-ui'
import { User } from '@ttab/elephant-ui/icons'


export const PersonalAssignmentsFilter = ({ assigneeId }: {
  assigneeId?: string | undefined
}): JSX.Element => {
  const { table } = useTable()

  return (
    <Button
      variant='outline'
      disabled={!assigneeId}
      className={`${!assigneeId ? 'opacity-50' : ''}`}
      onClick={() => {
        table.setColumnFilters((prev) => {
          const isColumnFiltered = prev.find((column) => column.id === 'assignees')
          if (isColumnFiltered) {
            return prev.filter((column) => column.id !== 'assignees')
          }
          if (!isColumnFiltered) {
            return prev.concat([{ id: 'assignees', value: [assigneeId] }])
          }
          return prev
        })
      }}
    >
      <User size={18} strokeWidth={1.75} className='shrink-0 sm:mr-2' />
      <div className='text-sm hidden @3xl/view:[display:revert]'>Mina uppdrag</div>
    </Button>
  )
}
