import { type DefaultValueOption } from '@/types'
import {
  FileTextIcon,
  CameraIcon,
  VideoIcon,
  ApertureIcon,
  ZapIcon,
  FileWarningIcon,
  PenToolIcon
} from '@ttab/elephant-ui/icons'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const AssignmentTypes: DefaultValueOption[] = [
  {
    label: 'Artikel',
    value: 'text',
    icon: FileTextIcon,
    iconProps
  },
  {
    label: 'Flash',
    value: 'flash',
    icon: ZapIcon,
    iconProps
  },
  {
    label: 'Till red',
    value: 'editorial-info',
    icon: FileWarningIcon,
    iconProps
  },
  {
    label: 'Grafik',
    value: 'graphic',
    icon: PenToolIcon,
    iconProps
  },
  {
    label: 'Bild',
    value: 'picture',
    icon: CameraIcon,
    iconProps
  },
  {
    label: 'Video',
    value: 'video',
    icon: VideoIcon,
    iconProps
  },
  {
    label: 'Bild/Video',
    value: 'picture/video',
    icon: ApertureIcon,
    iconProps
  }
]
