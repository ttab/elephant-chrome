import type { StatusSpecification, WorkflowSpecification } from '@/defaults/workflowSpecification'
import type { Status } from '@/shared/Repository'
import { Button } from '@ttab/elephant-ui'
import { ChevronDownIcon } from '@ttab/elephant-ui/icons'
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
      title={asSave ? workflow[props.currentStatusName]?.changedDescription : workflow[props.currentStatusName]?.description}
      {...rest}
    >
      <div className='pe-2 relative'>
        <CurrentIcon
          strokeWidth={1.75}
          className={currentStatusDef?.className}
        />
        {asSave && (
          <span className='absolute top-0 right-0 -translate-y-0.5 -translate-x-1 inline-flex items-center justify-center w-3 h-3 text-[10px] font-bold text-white dark:text-black bg-cancelled rounded-full'>
            !
          </span>
        )}
      </div>
      <div className='pe-1'>
        {asSave
          ? workflow[currentStatusName]?.asSaveCTA
          : workflow[currentStatusName]?.title}
      </div>
      <div className='ps-1'>
        <ChevronDownIcon size={16} />
      </div>

    </Button>
  )
}
)

StatusButton.displayName = 'StatusButton'
