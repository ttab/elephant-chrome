import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import { selectableStatuses } from '@/views/Planning/components/AssignmentStatus'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const isVisualAssignment = ['picture', 'video'].includes(type || '')
  const visualStatus = selectableStatuses.find((s) => s.value === status)

  const label = isVisualAssignment
    ? visualStatus?.label || null
    : WorkflowSpecifications['core/article']?.[status]?.title || null

  const docStatus = isVisualAssignment
    ? { ...visualStatus, ...visualStatus?.iconProps }
    : StatusSpecifications[status]

  const Icon = docStatus?.icon

  return (
    <div className='flex items-center' title={label || undefined}>
      {Icon ? <Icon strokeWidth={1.75} className={docStatus?.className} /> : null}
    </div>
  )
}
