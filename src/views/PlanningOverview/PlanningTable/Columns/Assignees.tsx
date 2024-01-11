import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { Users } from '@ttab/elephant-ui/icons'

export const assignees: ColumnDef<Planning> = {
  id: 'assignees',
  meta: {
    filter: 'facet',
    name: 'Assignees',
    columnIcon: Users
  },
  accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
  cell: ({ row }) => {
    const assignees = row.getValue<string[]>('assignees') || []
    return <AssigneeAvatars assignees={assignees} />
  }
}
