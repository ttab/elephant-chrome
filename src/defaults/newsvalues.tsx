import { type DefaultValueOption } from '@/types'
import {
  SignalHigh,
  SignalMedium,
  SignalLow
} from '@ttab/elephant-ui/icons'

const iconProps = {
  size: 18,
  strokeWidth: 1.75
}
export const Newsvalues: DefaultValueOption[] = [
  {
    value: '6',
    label: '6',
    icon: SignalHigh,
    iconProps: {
      color: '#E12430',
      ...iconProps
    }
  },
  {
    value: '5',
    label: '5',
    icon: SignalHigh,
    iconProps: {
      color: '#FF5050',
      ...iconProps
    }
  },
  {
    value: '4',
    label: '4',
    icon: SignalMedium,
    iconProps
  },
  {
    value: '3',
    label: '3',
    icon: SignalMedium,
    iconProps
  },
  {
    value: '2',
    label: '2',
    icon: SignalLow,
    iconProps
  },
  {
    value: '1',
    label: '1',
    icon: SignalLow,
    iconProps
  }
]
