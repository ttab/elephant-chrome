import type { StatusSpecification, WorkflowTransition } from '@/defaults/workflowSpecification'
import { DropdownMenuItem, Tooltip } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { CircleArrowRightIcon } from '@ttab/elephant-ui/icons'

export const StatusMenuOption = ({
  statusDef, state, status, onSelect, hasChanges, disabledReason
}: {
  statusDef: StatusSpecification
  state: WorkflowTransition
  status: string
  onSelect: (state: { status: string } & WorkflowTransition) => void
  hasChanges?: boolean
  disabledReason?: string
}) => {
  const iconProps = {
    size: 21,
    strokeWidth: 1.75,
    className: cn(statusDef.className, '-mt-0.5'),
    icon: status === 'usable' && hasChanges ? CircleArrowRightIcon : statusDef.icon
  }

  const Icon = status === 'usable' && hasChanges ? CircleArrowRightIcon : statusDef.icon
  const isDisabled = !!disabledReason

  const item = (
    <DropdownMenuItem
      disabled={isDisabled}
      className={cn(
        'flex flex-row gap-5 w-full py-2 pe-2 items-start rounded-md',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      onSelect={() => onSelect({ status, ...state })}
    >
      <div className='w-4 grow-0 shrink-0 pt-0.5'>
        {!!Icon && <Icon {...iconProps} />}
      </div>

      <div className='grow flex flex-col gap-0.5'>
        <div className='font-semibold'>{state.title}</div>
        <div className='w-full text-sm text-muted-foreground pe-2'>
          {hasChanges && state.changedDescription ? state.changedDescription : state.description}
        </div>
      </div>
    </DropdownMenuItem>
  )

  if (!isDisabled) {
    return item
  }

  return (
    <Tooltip content={disabledReason}>
      {item}
    </Tooltip>
  )
}
