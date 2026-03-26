import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { useMemo } from 'react'
import type { JSX } from 'react'

export const Assignees = ({ assignees, tooltip }: { assignees: string[], tooltip?: boolean }): JSX.Element => {
  return useMemo(() => <AssigneeAvatars assignees={assignees} tooltip={tooltip} />, [assignees, tooltip])
}
