import { isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { JSX } from 'react'
import { selectableStatuses } from '@/views/Planning/components/AssignmentStatus'

export const DocumentStatus = ({ type, status, updated = false, loading = false }: {
  type?: string
  status?: string
  updated?: boolean
  loading?: boolean
}): JSX.Element => {
  if (!status || !type) {
    return <div className='w-6 h-6' />
  }
  const visualStatus = selectableStatuses.find((s) => s.value === status)

  const label = isVisualAssignmentType(type)
    ? visualStatus?.label || null
    : WorkflowSpecifications['core/article']?.[status]?.title || null

  const docStatus = isVisualAssignmentType(type)
    ? { ...visualStatus, ...visualStatus?.iconProps }
    : StatusSpecifications[status]

  const Icon = docStatus?.icon

  if (loading) {
    return (
      <div className='relative flex items-center justify-center w-6 h-6' title='Loading...'>
        <div className='absolute w-4 h-4 bg-gray-400 rounded-full opacity-75 animate-ping' />
        <div className='relative w-2 h-2 bg-gray-300 rounded-full' />
      </div>
    )
  }

  return (
    <div className='relative flex items-center justify-center w-6 h-6' title={label || undefined}>
      {Icon ? <Icon strokeWidth={1.75} className={docStatus?.className} /> : null}
      {updated && <div className='absolute -left-3 w-2 h-2 bg-gray-400 rounded-full' style={{ top: '50%', transform: 'translateY(-50%)' }} />}
    </div>
  )
}
