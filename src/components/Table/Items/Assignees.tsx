import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { useMemo } from 'react'

export const Assignees = ({ assignees }: { assignees: string[] }): JSX.Element => {
  return useMemo(() => <AssigneeAvatars assignees={assignees} />, [assignees])
}
