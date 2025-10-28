import { timeSlotTypes } from '@/defaults/assignmentTimeConstants'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { AlarmClockCheckIcon, CalendarClockIcon, ClockFadingIcon } from '@ttab/elephant-ui/icons'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export interface TimeDef {
  name: 'start' | 'range' | 'slot' | 'publish'
  time: Array<string | Date>
  newTime: Array<string | Date>
  tooltip?: string
  icon?: LucideIcon
}

/**
 * Hook that updates to the correct assignment time with icons and labels based
 * on the current open collaborative planning document.
 */
export function useAssignmentTime(
  assignment: Y.Map<unknown>,
  newDate?: string
): undefined | TimeDef {
  const [assignmentType] = useYValue<string>(assignment, 'meta.core/assignment-type[0].value')
  const [publishTime] = useYValue<string>(assignment, 'data.publish')
  const [startTime] = useYValue<string>(assignment, 'data.start')
  const [endTime] = useYValue<string>(assignment, 'data.end')
  const [publishSlot] = useYValue<string>(assignment, 'data.publish_slot')

  if (typeof assignmentType !== 'string') {
    return undefined
  }

  if (['picture', 'video'].includes(assignmentType) && startTime) {
    if (endTime && startTime && endTime !== startTime) {
      const originalStart = new Date(startTime)
      const originalEnd = new Date(endTime)

      return {
        name: 'range',
        time: [originalStart, originalEnd],
        newTime: [
          combineDateAndTime(newDate, originalStart),
          combineDateAndTime(newDate, originalEnd)
        ],
        tooltip: 'Start- och sluttid',
        icon: ClockFadingIcon
      }
    }

    const originalStart = new Date(startTime)

    return {
      name: 'start',
      time: [originalStart],
      newTime: [combineDateAndTime(newDate, originalStart)],
      tooltip: 'Starttid',
      icon: CalendarClockIcon
    }
  }

  if (publishSlot) {
    const slotName = timeSlotTypes.find((slot) => slot.slots?.includes(publishSlot))

    return {
      name: 'slot',
      time: [slotName?.label || ''],
      newTime: [slotName?.label || ''], // For slot types, newTime is same as time since it's just a label
      tooltip: 'Publiceringsfönster',
      icon: slotName?.icon
    }
  }

  if (publishTime) {
    const originalPublish = new Date(publishTime)

    return {
      name: 'publish',
      time: [originalPublish],
      newTime: [combineDateAndTime(newDate, originalPublish)],
      tooltip: 'Publiceringstid',
      icon: AlarmClockCheckIcon
    }
  }

  if (endTime && startTime && endTime !== startTime) {
    const originalStart = new Date(startTime)
    const originalEnd = new Date(endTime)

    return {
      name: 'range',
      time: [originalStart, originalEnd],
      newTime: [
        combineDateAndTime(newDate, originalStart),
        combineDateAndTime(newDate, originalEnd)
      ],
      tooltip: 'Start- och sluttid',
      icon: ClockFadingIcon
    }
  }

  if (startTime) {
    const originalStart = new Date(startTime)

    return {
      name: 'start',
      time: [originalStart],
      newTime: [combineDateAndTime(newDate, originalStart)],
      tooltip: 'Starttid',
      icon: CalendarClockIcon
    }
  }
}

/**
 * Helper function to combine new date with existing time
 */
function combineDateAndTime(newDateString: string | undefined, originalDate: Date): Date {
  if (!newDateString) {
    return originalDate
  }

  const newDate = new Date(newDateString)
  const combined = new Date(newDate)

  // Set the time components from the original date
  combined.setHours(originalDate.getHours())
  combined.setMinutes(originalDate.getMinutes())
  combined.setSeconds(originalDate.getSeconds())
  combined.setMilliseconds(originalDate.getMilliseconds())

  return combined
}
