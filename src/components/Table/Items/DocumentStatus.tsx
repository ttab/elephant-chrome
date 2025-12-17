import { isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { JSX } from 'react'
import { selectableStatuses } from '@/views/Planning/components/AssignmentStatus'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const visualStatus = selectableStatuses.find((s) => s.value === status)

  const label = isVisualAssignmentType(type)
    ? visualStatus?.label || null
    : WorkflowSpecifications['core/article']?.[status]?.title || null

  const docStatus = isVisualAssignmentType(type)
    ? { ...visualStatus, ...visualStatus?.iconProps }
    : StatusSpecifications[status]

  const Icon = docStatus?.icon

  return (
    <div className='flex items-center' title={label || undefined}>
      {Icon ? <Icon strokeWidth={1.75} className={docStatus?.className} /> : null}
    </div>
  )
}
