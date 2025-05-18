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
    const status = assignment._deliverableStatus
    const { publish, start, publish_slot } = assignment.data
    let hour: number

    if (status === 'withheld' && publish) {
      // When scheduled we want it in that particular hour.
      hour = getHours(toZonedTime(parseISO(publish), timeZone))
    } else if (publish_slot) {
      // FIXME: It seems publish_slot is wrong here event though it is correct in repo!
      // If assigned a publish slot, then we use that. Publish slot is already an hour.
      hour = parseInt(publish_slot)
    } else {
      // In all other cases we rely on the start time.
      hour = getHours(toZonedTime(parseISO(start), timeZone))
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
