import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'

export const assignees: ColumnDef<Planning> = {
  id: 'assignees',
  accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
  cell: ({ row }) => {
    const assignees = row.getValue<string[]>('assignees') || []
    return <AssigneeAvatars assignees={assignees} />
  }
}
