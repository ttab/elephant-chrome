import { CalendarFoldIcon, CalendarClockIcon, Clock2Icon, Clock5Icon, Clock6Icon, Clock10Icon, ClockFading, Clock1 } from '@ttab/elephant-ui/icons'
import { type AssignmentValueOption } from '../components/AssignmentTime/types'


const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

// FIXME: These constants should be merged with ./assignmentTimeslots.ts
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
    slots: ['0', '1', '2', '3', '4', '5', '6'],
    median: '5'
  },
  {
    label: 'Förmiddag',
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps,
    slots: ['7', '8', '9', '10', '11', '12'],
    median: '10'
  },
  {
    label: 'Eftermiddag',
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps,
    slots: ['13', '14', '15', '16', '17', '18'],
    median: '16'
  },
  {
    label: 'Kväll',
    value: 'evening',
    icon: Clock6Icon,
    iconProps,
    slots: ['19', '20', '21', '22', '23'],
    median: '21'
  }
]

export const timePickTypes: AssignmentValueOption[] = [
  {
    label: 'Välj tid',
    value: 'endexecution',
    icon: CalendarClockIcon,
    iconProps
  },
  {
    label: 'Välj tid',
    value: 'start-end-execution',
    icon: ClockFading,
    iconProps
  },
  {
    label: 'Välj tid',
    value: 'start-end-execution',
    icon: Clock1,
    iconProps
  }
]
