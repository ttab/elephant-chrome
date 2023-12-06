import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  FileType,
  Image,
  Camera,
  Video
} from '@ttab/elephant-ui/icons'

export const sectors = [
  {
    value: 'Utrikes',
    label: 'Utrikes',
    color: 'bg-[#BD6E11]'
  },
  {
    value: 'Inrikes',
    label: 'Inrikes',
    color: 'bg-[#DA90E1]'
  },
  {
    value: 'Sport',
    label: 'Sport',
    color: 'bg-[#6CA8DF]'
  },
  {
    value: 'Kultur och nöje',
    label: 'Kultur & Nöje',
    color: 'bg-[#12E1D4]'
  },
  {
    value: 'Ekonomi',
    label: 'Ekonomi',
    color: 'bg-[#FFB9B9]'
  }
]

export const priorities = [
  {
    label: 'High',
    value: '1',
    icon: SignalHigh,
    color: '#FF5050'
  },
  {
    label: 'Medium',
    value: '2',
    icon: SignalMedium
  },
  {
    label: 'Low',
    value: '3',
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
