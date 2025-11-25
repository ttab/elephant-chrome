import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import { isConceptType } from '@/views/Concepts/lib/isConceptType'
import { Tooltip } from '@ttab/elephant-ui'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const newStatus = isConceptType(type) && status === 'unpublished' ? 'inactive' : status
  const docStatus = StatusSpecifications[newStatus]
  const label = WorkflowSpecifications[type]?.[status]?.title || null
  return (
    <Tooltip content={label}>
      <div className='flex items-center'>
        {docStatus?.icon
          ? <docStatus.icon strokeWidth={1.75} className={docStatus.className} />
          : null}
      </div>
    </Tooltip>
  )
}
