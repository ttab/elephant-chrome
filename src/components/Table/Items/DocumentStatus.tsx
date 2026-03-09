import { isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { JSX } from 'react'
import { selectableStatuses } from '@/views/Planning/components/AssignmentStatus'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const visualStatus = selectableStatuses.find((s) => s.value === status)

  const getStatusLabel = () => {
    if (isVisualAssignmentType(type)) {
      return visualStatus?.label || null
    }
    if (type === 'core/factbox') {
      return WorkflowSpecifications['core/factbox']?.[status]?.title || null
    }

    return WorkflowSpecifications['core/article']?.[status]?.title || null
  }

  const label = getStatusLabel()
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
