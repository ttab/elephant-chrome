import { isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { getStatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { JSX } from 'react'
import { selectableStatuses } from '@/views/Planning/components/AssignmentStatus'

export const DocumentStatus = ({ type, status, isChanged }: {
  type: string
  status: string
  isChanged?: boolean
}): JSX.Element => {
  const visualStatus = selectableStatuses.find((s) => s.value === status)

  const getStatusLabel = () => {
    if (isVisualAssignmentType(type)) {
      return visualStatus?.label || null
    }
    if (type === 'core/factbox') {
      return WorkflowSpecifications[type]?.[status]?.title || null
    }

    return WorkflowSpecifications['core/article']?.[status]?.title || null
  }

  const label = getStatusLabel()
  const docStatus = isVisualAssignmentType(type)
    ? { ...visualStatus, ...visualStatus?.iconProps }
    : getStatusSpecifications(status, type)

  const Icon = docStatus?.icon
  return (
    <div className='flex items-center relative' title={label || undefined}>
      {Icon
        ? (
            <>
              <Icon strokeWidth={1.75} className={docStatus?.className} />
              {isChanged && (
                <span className='absolute top-0 -right-1.5 -translate-y-0.5 -translate-x-1 inline-flex items-center justify-center w-3 h-3 text-[10px] font-bold text-white dark:text-black bg-cancelled rounded-full'>
                  !
                </span>
              )}
            </>
          )
        : null}
    </div>
  )
}
