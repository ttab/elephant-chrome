import { useYValue } from '@/hooks/useYValue'
import { Tooltip, Select, SelectTrigger, SelectContent, SelectItem } from '@ttab/elephant-ui'
import { BuildingIcon, GlobeIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { useCallback, useMemo } from 'react'
import type { FormProps } from '../Form/Root'

export const AssignmentVisibility = ({ path, editable, disabled, className = '', onChange }: {
  path: string
  editable: boolean
  disabled: boolean
  className?: string
} & FormProps): JSX.Element => {
  const [visibilityStatus, setAssignmentVisibility] = useYValue<string>(path)

  const onValueChange = useCallback(
    (value: string) => {
      setAssignmentVisibility(value)
      onChange?.(true)
    }, [setAssignmentVisibility, onChange]
  )

  const tooltipContent = useMemo(
    () => (visibilityStatus === 'true' ? 'Publikt' : 'Internt'),
    [visibilityStatus]
  )

  const renderIcon = (status: string) => status === 'true'
    ? <GlobeIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
    : <BuildingIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />

  if (!editable && visibilityStatus) {
    return (
      <div className={cn('flex items-center', className)}>
        <Tooltip content={tooltipContent}>
          {renderIcon(visibilityStatus)}
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
        <SelectTrigger>{renderIcon(visibilityStatus || 'false')}</SelectTrigger>
        <SelectContent>
          <SelectItem key='true' value='true'>
            <span className='flex flex-row gap-2'>
              <GlobeIcon size={18} strokeWidth={1.75} />
              Publik
            </span>
          </SelectItem>
          <SelectItem key='false' value='false'>
            <span className='flex flex-row gap-2'>
              <BuildingIcon size={18} strokeWidth={1.75} />
              Internt
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
