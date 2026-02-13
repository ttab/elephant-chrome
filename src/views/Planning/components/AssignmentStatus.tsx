import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@ttab/elephant-ui'
import { useCallback, useMemo } from 'react'
import type * as Y from 'yjs'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { CircleDotIcon, CircleCheckIcon, CircleArrowUpIcon } from '@ttab/elephant-ui/icons'
import type { DefaultValueOption } from '@/types/index'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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

  const { t } = useTranslation('shared')

  const IconComponent = StatusIcon?.icon

  return (
    <div className='flex h-8 w-12 items-center justify-start' title={StatusIcon?.value ? t(`core:status.${StatusIcon?.value}`) : StatusIcon?.value}>
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
  const { t } = useTranslation()
  const onValueChange = useCallback((value: string) => {
    setVisualAssignmentStatus(value)
    snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
      .catch((ex) => {
        console.error('Failed to snapshot document after changing visual assignment status', ex)
        toast.error(t('errors:toasts.saveChangeError'))
      })
  }, [setVisualAssignmentStatus, ydoc, t])


  const currentStatus = selectableStatuses
    .find((status) => status.value === visualAssignmentStatus)
    ?? selectableStatuses[0]

  return (
    <div className='w-12' title={t(`core:status.${currentStatus.value}`)}>
      <Select
        name='AssignmentStatus'
        onValueChange={onValueChange}
        value={visualAssignmentStatus || 'todo'}
      >
        <SelectTrigger
          className='flex h-8 w-12 items-center justify-start -ml-1 px-1'
          onPointerDownCapture={stopRowClick}
          onClick={stopRowClick}
        >
          {currentStatus.icon && (
            <currentStatus.icon {...currentStatus.iconProps} />
          )}
        </SelectTrigger>
        <SelectContent>
          {selectableStatuses.map(({ value, icon: IconComponent, iconProps }) => (
            <SelectItem
              key={value}
              value={value}
              className='flex justify-start'
              aria-label={t(`core:status.${value}`)}
              onPointerDownCapture={stopRowClick}
              onClick={stopRowClick}
            >
              <span className='flex flex-row items-center justify-start gap-2'>
                {IconComponent && <IconComponent {...iconProps} />}
                <span>{t(`core:status.${value}`)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function stopRowClick(event: React.PointerEvent | React.MouseEvent) {
  event.stopPropagation()
}

export const selectableStatuses: DefaultValueOption[] = [
  {
    value: 'todo',
    label: '',
    icon: CircleDotIcon,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'started',
    label: '',
    icon: CircleArrowUpIcon,
    iconProps: {
      className: 'bg-done text-white dark:text-black rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    value: 'done',
    label: '',
    icon: CircleCheckIcon,
    iconProps: {
      className: 'bg-usable text-white dark:text-black fill-usable rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
