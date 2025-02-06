import { toZonedTime } from 'date-fns-tz'
import { parseISO, getHours } from 'date-fns'
import type { AssignmentInterface } from './types'

export interface AssignmentResponseInterface {
  key?: string
  label?: string
  hours?: number[]
  items: AssignmentInterface[]
}

/**
 * Split the assignments into the different time slots
 *
 * @param {string} timeZone - The time zone to use for converting publish times
 * @param {AssignmentInterface[] | undefined} assignments - The list of assignments to structure
 * @param {Object[]} [slots] - The time slots to categorize assignments into
 * @param {string} slots[].key - The key for the time slot
 * @param {string} slots[].label - The label for the time slot
 * @param {number[]} slots[].hours - The hours that define the time slot
 * @returns {AssignmentResponseInterface[]} - The structured assignments categorized into time slots
 */
export function structureAssignments(
  timeZone: string,
  assignments: AssignmentInterface[],
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
): AssignmentResponseInterface[] {
  if (!slots) {
    return [{
      items: assignments
    }]
  }

  const response = slots.map((slot) => {
    return {
      ...slot,
      items: [] as AssignmentInterface[]
    }
  })

  assignments.forEach((assignment) => {
    let hour: number

    if (assignment.data.publish) {
      hour = getHours(toZonedTime(parseISO(assignment.data.publish), timeZone))
    } else if (assignment.data.publish_slot) {
      hour = parseInt(assignment.data.publish_slot)
    }

    response.forEach((slot) => {
      if (!hour && !slot.hours.length) {
        slot.items.push(assignment)
      } else if (hour && slot.hours.includes(hour)) {
        slot.items.push(assignment)
      }
    })
  }, [])

  return response
}
