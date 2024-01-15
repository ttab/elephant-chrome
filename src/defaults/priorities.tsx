import { type ColumnValueOption } from '@/types'
import {
  SignalHigh,
  SignalMedium,
  SignalLow
} from '@ttab/elephant-ui/icons'

export const Priorities: ColumnValueOption[] = [
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
    icon: SignalMedium,
    color: ''
  },
  {
    value: '3',
    label: '3',
    icon: SignalMedium,
    color: ''
  },
  {
    value: '2',
    label: '2',
    icon: SignalLow,
    color: ''
  },
  {
    value: '1',
    label: '1',
    icon: SignalLow,
    color: ''
  }
]
