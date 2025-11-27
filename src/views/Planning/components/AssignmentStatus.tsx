import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@ttab/elephant-ui'
import { useCallback, useMemo } from 'react'
import type * as Y from 'yjs'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { CircleDotIcon, CircleCheckIcon, CircleArrowUpIcon } from '@ttab/elephant-ui/icons'

export const AssignmentStatus = (props: {
  ydoc?: YDocument<Y.Map<unknown>>
  path?: string
  isVisualAssignment: boolean
  workflowState?: string
}) => {
  if (props.isVisualAssignment && props.ydoc && props.path) {
    return <VisualAssignment ydoc={props.ydoc} path={props.path} />
  }

  return <TextAssignment workflowState={props.workflowState} />
}

// For text-based assignment status display the documents status based on workflowState
const TextAssignment = ({ workflowState }: {
  workflowState?: string
}) => {
  const StatusIcon = useMemo(() => {
    return DocumentStatuses.find((status) => status.value === workflowState)
  }, [workflowState])


  const IconComponent = StatusIcon?.icon

  return (
    <div className='flex h-8 w-12 items-center justify-start' title={StatusIcon?.label}>
      {IconComponent ? <IconComponent {...StatusIcon.iconProps} /> : null}
    </div>
  )
}

// For visual assignments (photo, video) display the assignments data.status property
const VisualAssignment = ({ ydoc, path }: {
  ydoc: YDocument<Y.Map<unknown>>
  path: string
}) => {
  const [visualAssignmentStatus, setVisualAssignmentStatus] = useYValue<string>(ydoc.ele, path)

  const onValueChange = useCallback((value: string) => {
    setVisualAssignmentStatus(value)
  }, [setVisualAssignmentStatus])


  const currentStatus = selectableStatuses
    .find((status) => status.value === visualAssignmentStatus)
    ?? selectableStatuses[0]

  return (
    <div className='w-12' title={currentStatus.label}>
      <Select
        name='AssignmentStatus'
        onValueChange={onValueChange}
        value={visualAssignmentStatus || 'todo'}
      >
        <SelectTrigger className='flex h-8 w-12 items-center justify-start -ml-1 px-1'>
          <currentStatus.Icon {...currentStatus.iconProps} />
        </SelectTrigger>
        <SelectContent>
          {selectableStatuses.map(({ value, Icon, iconProps, label }) => (
            <SelectItem key={value} value={value} className='flex justify-start' aria-label={label}>
              <span className='flex flex-row items-center justify-start gap-2'>
                <Icon {...iconProps} />
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const selectableStatuses = [
  {
    value: 'todo',
    label: 'Att göra',
    Icon: CircleDotIcon,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'started',
    label: 'Påbörjad',
    Icon: CircleArrowUpIcon,
    iconProps: {
      color: '#ffffff',
      className: 'bg-done rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'done',
    label: 'Klar',
    Icon: CircleCheckIcon,
    iconProps: {
      color: '#ffffff',
      className: 'bg-usable fill-usable rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
