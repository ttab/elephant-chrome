import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  FileType,
  Image,
  Camera,
  Video
} from '@ttab/elephant-ui/icons'

export const priorities = [
  {
    value: '6',
    label: '6',
    icon: SignalHigh,
    color: '#FF5050'
  },
  {
    value: '5',
    label: '5',
    icon: SignalHigh,
    color: '#FF5050'
  },
  {
    value: '4',
    label: '4',
    icon: SignalMedium
  },
  {
    value: '3',
    label: '3',
    icon: SignalMedium
  },
  {
    value: '2',
    label: '2',
    icon: SignalLow
  },
  {
    value: '1',
    label: '1',
    icon: SignalLow
  }
]

export const assignmentTypes = [
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
