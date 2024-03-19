import { type DefaultValueOption } from '@/types'
import {
  FileText,
  Image,
  Camera,
  Video
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
    label: 'Graphic',
    value: 'graphic',
    icon: Image,
    iconProps
  },
  {
    label: 'Picture',
    value: 'picture',
    icon: Camera,
    iconProps
  },
  {
    label: 'Video',
    value: 'video',
    icon: Video,
    iconProps
  }
]
