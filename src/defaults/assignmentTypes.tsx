import { type DefaultValueOption } from '@/types'
import {
  FileText,
  Image,
  Camera,
  Video,
  Aperture,
  ZapIcon
} from '@ttab/elephant-ui/icons'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const AssignmentTypes: DefaultValueOption[] = [
  {
    label: 'Text',
    value: 'text',
    icon: FileText,
    iconProps
  },
  {
    label: 'Flash',
    value: 'flash',
    icon: ZapIcon,
    iconProps
  },
  {
    label: 'Grafik',
    value: 'graphic',
    icon: Image,
    iconProps
  },
  {
    label: 'Bild',
    value: 'picture',
    icon: Camera,
    iconProps
  },
  {
    label: 'Video',
    value: 'video',
    icon: Video,
    iconProps
  },
  {
    label: 'Bild/Video',
    value: 'picture/video',
    icon: Aperture,
    iconProps
  }
]
