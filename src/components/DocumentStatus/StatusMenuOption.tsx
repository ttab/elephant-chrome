import type { StatusSpecification, WorkflowTransition } from '@/defaults/workflowSpecification'
import { DropdownMenuItem } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { CircleArrowRightIcon } from 'lucide-react'

export const StatusMenuOption = ({ statusDef, state, status, onSelect, hasChanges }: {
  statusDef: StatusSpecification
  state: WorkflowTransition
  status: string
  onSelect: (state: { status: string } & WorkflowTransition) => void
  hasChanges?: boolean
}) => {
  const iconProps = {
    size: 21,
    strokeWidth: 1.75,
    className: cn(statusDef.className, '-mt-0.5'),
    icon: status === 'usable' && hasChanges ? CircleArrowRightIcon : statusDef.icon
  }

  const Icon = status === 'usable' && hasChanges ? CircleArrowRightIcon : statusDef.icon

  return (
    <DropdownMenuItem
      className='flex flex-row gap-5 w-full py-2 pe-2 items-start rounded-md'
      onClick={() => onSelect({ status, ...state })}
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
}
