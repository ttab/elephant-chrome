import { toZonedTime } from 'date-fns-tz'
import { parseISO, getHours } from 'date-fns'
import type { AssignmentInterface } from './types'
import type { StatusData } from 'src/datastore/types'
import { getTimeValue } from './getTimeValue'

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
    let hour: number | undefined

    if (status === 'withheld' && publish) {
      // When scheduled, we want it in that particular hour.
      hour = getHours(toZonedTime(parseISO(publish), timeZone))
    } else if (publish_slot) {
      // If assigned a publish slot, then we use that. Publish slot is already an hour.
      hour = parseInt(publish_slot)
    } else if (start) {
      // In all other cases we rely on the start time.
      hour = getHours(toZonedTime(parseISO(start), timeZone))
    }

    let assigned = false
    for (const slot of response) {
      if (Number.isInteger(hour) && slot.hours.includes(hour as number)) {
        slot.items.push(assignment)
        assigned = true
        break
      }
    }

    if (!assigned) {
      response[0].items.push(assignment)
    }
  })

  response.forEach((slot) => {
    slot.items.sort((a, b) => {
      if (a?._statusData && b?._statusData) {
        const aData = JSON.parse(a._statusData) as StatusData
        const bData = JSON.parse(b._statusData) as StatusData
        return getTimeValue(aData?.modified) > getTimeValue(bData.modified) ? -1 : 1
      }

      const aHasSlot = !!a.data.publish_slot
      const bHasSlot = !!b.data.publish_slot
      if (aHasSlot && !bHasSlot) return -1
      if (!aHasSlot && bHasSlot) return 1

      const aWithheld = a._deliverableStatus === 'withheld' && a.data.publish
      const bWithheld = b._deliverableStatus === 'withheld' && b.data.publish
      if (aWithheld && bWithheld) {
        return a.data.publish.localeCompare(b.data.publish)
      }
      if (aWithheld) return -1
      if (bWithheld) return 1


      if (a.data.start && b.data.start) {
        return a.data.start.localeCompare(b.data.start)
      }
      return 0
    })
  })

  return response
}
