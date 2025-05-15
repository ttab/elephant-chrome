import type { StatusSpecification, WorkflowSpecification } from '@/defaults/workflowSpecification'
import type { Status } from '@/shared/Repository'
import { Button } from '@ttab/elephant-ui'
import { ChevronDown } from '@ttab/elephant-ui/icons'
import { forwardRef } from 'react'

export const StatusButton = forwardRef<HTMLButtonElement, {
  asSave: boolean
  documentStatus: Status
  workflow: WorkflowSpecification
  currentStatusName: string
  currentStatusDef: StatusSpecification
}>((props, ref) => {
  const {
    asSave,
    documentStatus,
    workflow,
    currentStatusName,
    currentStatusDef,
    ...rest
  } = props
  const CurrentIcon = currentStatusDef.icon

  return (
    <Button
      ref={ref}
      size='sm'
      variant='outline'
      className='flex items-center h-8 px-3'
      title={workflow[props.currentStatusName]?.description}
      {...rest}
    >
      <div className='pe-2'>
        <CurrentIcon
          size={18}
          strokeWidth={1.75}
          className={currentStatusDef?.className}
        />
      </div>
      <div className='pe-1'>
        {asSave ? 'Opublicerade ändringar' : workflow[currentStatusName]?.title}
      </div>
      <div className='ps-1'>
        <ChevronDown size={16} />
      </div>

    </Button>
  )
}
)

StatusButton.displayName = 'StatusButton'
