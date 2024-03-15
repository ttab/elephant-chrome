import { type DefaultValueOption } from '@/types'
import {
  FileText,
  Image,
  Camera,
  Video
} from '@ttab/elephant-ui/icons'


export const AssignmentTypes: DefaultValueOption[] = [
  {
    label: 'Text',
    value: 'text',
    icon: FileText
  },
  {
    label: 'Graphic',
    value: 'graphic',
    icon: Image
  },
  {
    label: 'Picture',
    value: 'picture',
    icon: Camera
  },
  {
    label: 'Video',
    value: 'video',
    icon: Video
  }
]
