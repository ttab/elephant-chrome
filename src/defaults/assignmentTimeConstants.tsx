import { CalendarFoldIcon, CalendarClockIcon, Clock2Icon, Clock5Icon, Clock6Icon, Clock10Icon } from '@ttab/elephant-ui/icons'
import { type AssignmentValueOption } from '../components/AssignmentTime/types'


const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const timeSlotTypes: AssignmentValueOption[] = [
  {
    label: 'Heldag',
    value: 'fullday',
    icon: CalendarFoldIcon,
    iconProps,
    slots: []
  },
  {
    label: 'Morgon',
    value: 'morning',
    icon: Clock5Icon,
    iconProps,
    slots: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    median: '7'
  },
  {
    label: 'Förmiddag',
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps,
    slots: ['10', '11', '12', '13'],
    median: '11'
  },
  {
    label: 'Eftermiddag',
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps,
    slots: ['14', '15', '16', '17'],
    median: '15'
  },
  {
    label: 'Kväll',
    value: 'evening',
    icon: Clock6Icon,
    iconProps,
    slots: ['18', '19', '20', '21', '22', '23'],
    median: '21'
  }
]

export const timePickTypes: AssignmentValueOption[] = [
  {
    label: 'Välj tid',
    value: 'endexcecution',
    icon: CalendarClockIcon,
    iconProps
  },
  {
    label: 'Välj tid',
    value: 'start-end-excecution',
    icon: CalendarClockIcon,
    iconProps
  }
]
