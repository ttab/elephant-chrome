import { type ColumnValueOption } from '@/types'
import {
  FileType,
  Image,
  Camera,
  Video
} from '@ttab/elephant-ui/icons'


export const AssignmentTypes: ColumnValueOption[] = [
  {
    label: 'Text',
    value: 'text',
    icon: FileType
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
