import { type DefaultValueOption } from '@/types'
import {
  SignalHigh,
  SignalMedium,
  SignalLow
} from '@ttab/elephant-ui/icons'

export const Newsvalues: DefaultValueOption[] = [
  {
    value: '6',
    label: '6',
    icon: SignalHigh,
    color: '#E12430'
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
