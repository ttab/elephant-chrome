import {
  CalendarFoldIcon,
  CalendarClockIcon,
  Clock2Icon,
  Clock5Icon,
  Clock6Icon,
  Clock10Icon,
  ClockFadingIcon,
  Clock1Icon
} from '@ttab/elephant-ui/icons'
import { type AssignmentValueOption } from '../components/AssignmentTime/types'
import i18n from '@/lib/i18n'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

// FIXME: These constants should be merged with ./assignmentTimeslots.ts
export const timeSlotTypes: AssignmentValueOption[] = [
  {
    label: i18n.t('core:timeSlots.fullday'),
    value: 'fullday',
    icon: CalendarFoldIcon,
    iconProps,
    slots: []
  },
  {
    label: i18n.t('core:timeSlots.morning'),
    value: 'morning',
    icon: Clock5Icon,
    iconProps,
    slots: ['0', '1', '2', '3', '4', '5', '6'],
    median: '5'
  },
  {
    label: i18n.t('core:timeSlots.forenoon'),
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps,
    slots: ['7', '8', '9', '10', '11', '12'],
    median: '10'
  },
  {
    label: i18n.t('core:timeSlots.afternoon'),
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps,
    slots: ['13', '14', '15', '16', '17', '18'],
    median: '16'
  },
  {
    label: i18n.t('core:timeSlots.evening'),
    value: 'evening',
    icon: Clock6Icon,
    iconProps,
    slots: ['19', '20', '21', '22', '23'],
    median: '21'
  }
]

export const timePickTypes: AssignmentValueOption[] = [
  {
    label: i18n.t('common:misc.selectTime'),
    value: 'endexecution',
    icon: CalendarClockIcon,
    iconProps
  },
  {
    label: i18n.t('common:misc.selectTime'),
    value: 'start-end-execution',
    icon: ClockFadingIcon,
    iconProps
  },
  {
    label: i18n.t('common:misc.selectTime'),
    value: 'start-end-execution',
    icon: Clock1Icon,
    iconProps
  }
]
