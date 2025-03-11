import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import { Tooltip } from '@ttab/elephant-ui'

export const DocumentStatus = ({ type, status }: {
  type: string
  status: string
}): JSX.Element => {
  const docStatus = StatusSpecifications[status]
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
