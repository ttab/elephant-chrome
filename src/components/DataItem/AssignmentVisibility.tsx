import { StatusSpecifications } from '@/defaults/workflowSpecification'
import { useYValue } from '@/hooks/useYValue'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Tooltip
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useCallback } from 'react'

export const AssignmentVisibility = ({ path, editable, disabled, className }: {
  path: string
  editable: boolean
  disabled: boolean
  className?: string
}): JSX.Element => {
  const [visibilityStatus] = useYValue<string>(path)
  const [, setAssignmentVisibility] = useYValue<string>(path)

  const onValueChange = useCallback(
    (value: string) => setAssignmentVisibility(value),
    [setAssignmentVisibility]
  )

  const renderIcon = useCallback(
    (statusKey: 'usable' | 'done') => {
      const status = StatusSpecifications[statusKey]
      const IconComponent = status?.icon
      return IconComponent
        ? <IconComponent strokeWidth={1.75} className={status.className} />
        : null
    },
    []
  )

  if (!editable && visibilityStatus) {
    return (
      <div className={cn('flex items-center', className)}>
        <Tooltip content={visibilityStatus === 'true' ? 'Publikt' : 'Internt'}>
          {renderIcon(visibilityStatus === 'true' ? 'usable' : 'done')}
        </Tooltip>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Select
        name='AssignmentVisibility'
        onValueChange={onValueChange}
        defaultValue={visibilityStatus || 'false'}
        disabled={disabled}
      >
        <SelectTrigger>
          {renderIcon(visibilityStatus === 'true' ? 'usable' : 'done')}
        </SelectTrigger>
        <SelectContent>
          <SelectItem key='true' value='true'>
            <span className='flex flex-row gap-2'>
              {renderIcon('usable')}
              Publikt
            </span>
          </SelectItem>
          <SelectItem key='false' value='false'>
            <span className='flex flex-row gap-2'>
              {renderIcon('done')}
              Internt
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
