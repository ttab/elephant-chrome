import { type DefaultValueOption } from '@/types'
import {
  FileTextIcon,
  CameraIcon,
  VideoIcon,
  ApertureIcon,
  ZapIcon,
  FileWarningIcon,
  ChartPieIcon
} from '@ttab/elephant-ui/icons'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const AssignmentTypes: DefaultValueOption[] = [
  {
    value: 'text',
    icon: FileTextIcon,
    iconProps
  },
  {
    value: 'flash',
    icon: ZapIcon,
    iconProps
  },
  {
    value: 'editorial-info',
    icon: FileWarningIcon,
    iconProps
  },
  {
    value: 'graphic',
    icon: ChartPieIcon,
    iconProps
  },
  {
    value: 'picture',
    icon: CameraIcon,
    iconProps
  },
  {
    value: 'video',
    icon: VideoIcon,
    iconProps
  },
  {
    value: 'picture/video',
    icon: ApertureIcon,
    iconProps
  }
]

export function isVisualAssignmentType(type: string | null | undefined): boolean {
  return ['picture', 'video', 'graphic'].includes(type || '')
}
