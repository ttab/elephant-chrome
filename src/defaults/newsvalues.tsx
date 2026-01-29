import { type DefaultValueOption } from '@/types'
import {
  SignalHighIcon,
  SignalMediumIcon,
  SignalLowIcon
} from '@ttab/elephant-ui/icons'

const iconProps = {
  size: 18,
  strokeWidth: 1.75
}
export const Newsvalues: Array<DefaultValueOption & { label: string }> = [
  {
    value: '6',
    label: '6',
    icon: SignalHighIcon,
    iconProps: {
      color: '#E12430',
      ...iconProps
    }
  },
  {
    value: '5',
    label: '5',
    icon: SignalHighIcon,
    iconProps: {
      color: '#FF5050',
      ...iconProps
    }
  },
  {
    value: '4',
    label: '4',
    icon: SignalMediumIcon,
    iconProps
  },
  {
    value: '3',
    label: '3',
    icon: SignalMediumIcon,
    iconProps
  },
  {
    value: '2',
    label: '2',
    icon: SignalLowIcon,
    iconProps
  },
  {
    value: '1',
    label: '1',
    icon: SignalLowIcon,
    iconProps
  }
]
