import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import { Tooltip } from '@ttab/elephant-ui'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const docStatus = StatusSpecifications[status]
  const label = WorkflowSpecifications[type]?.[status]?.title || null
  console.log(status)
  return (
    <Tooltip content={label}>
      <div className='flex items-center'>
        {docStatus?.icon
          ? <docStatus.icon strokeWidth={1.75} className={(status === 'unpublished' && type === 'core/section') ? 'bg-gray-300 text-white fill-gray-300 rounded-full' : docStatus.className} />
          : null}
      </div>
    </Tooltip>
  )
}
