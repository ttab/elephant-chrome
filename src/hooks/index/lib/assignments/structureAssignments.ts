import { toZonedTime } from 'date-fns-tz'
import { parseISO, getHours } from 'date-fns'
import type { ApprovalItem } from '@/views/Approvals/types'
import { getTimeValue } from './getTimeValue'
import { getPublishSlot, getStartTime, getPublishTime } from '@/lib/documentHelpers'

export interface AssignmentResponseInterface {
  key?: string
  label?: string
  hours?: number[]
  items: ApprovalItem[]
}

/**
 * Split the approval items into the different time slots
 * @param {string} timeZone - The time zone to use for converting publish times
 * @param {ApprovalItem[]} items - The list of approval items to structure
 * @param {Object[]} [slots] - The time slots to categorize items into
 * @param {string} slots[].key - The key for the time slot
 * @param {string} slots[].label - The label for the time slot
 * @param {number[]} slots[].hours - The hours that define the time slot
 * @returns {AssignmentResponseInterface[]} - The structured items categorized into time slots
 */
export function structureAssignments(
  timeZone: string,
  items: ApprovalItem[],
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
): AssignmentResponseInterface[] {
  if (!slots) {
    return [{
      items
    }]
  }

  const response = slots.map((slot) => {
    return {
      ...slot,
      items: [] as ApprovalItem[]
    }
  })

  items.forEach((item) => {
    const status = item.deliverable?.status
    const meta = item.deliverable?.meta
    const hasUsable = meta?.heads.usable?.id

    const publish = getPublishTime(item.assignment)
    const start = getStartTime(item.assignment)
    const publishSlot = getPublishSlot(item.assignment)
    let hour: number | undefined

    if (status === 'withheld' && publish) {
      // When scheduled, we want it in that particular hour.
      hour = getHours(toZonedTime(parseISO(publish), timeZone))
    } else if (hasUsable && meta?.modified) {
      hour = getHours(parseISO(meta.modified))
    } else if (publishSlot) {
      // If assigned a publish slot, then we use that. Publish slot is already an hour.
      hour = parseInt(publishSlot)
    } else if (start) {
      // In all other cases we rely on the start time.
      hour = getHours(toZonedTime(parseISO(start), timeZone))
    }

    let assigned = false
    for (const slot of response) {
      if (Number.isInteger(hour) && slot.hours.includes(hour as number)) {
        slot.items.push(item)
        assigned = true
        break
      }
    }

    if (!assigned) {
      response[0].items.push(item)
    }
  })

  response.forEach((slot) => {
    slot.items.sort((a, b) => {
      const aMeta = a.deliverable?.meta
      const bMeta = b.deliverable?.meta
      const aPublish = getPublishTime(a.assignment)
      const bPublish = getPublishTime(b.assignment)

      if (aMeta && bMeta) {
        const aWithheld = a.deliverable?.status === 'withheld' && aPublish
        const bWithheld = b.deliverable?.status === 'withheld' && bPublish

        if (aWithheld && bWithheld && aPublish && bPublish) {
          return aPublish.localeCompare(bPublish)
        }

        if (aWithheld) return -1
        if (bWithheld) return 1

        return getTimeValue(aMeta?.modified) > getTimeValue(bMeta.modified) ? -1 : 1
      }

      const aHasSlot = !!getPublishSlot(a.assignment)
      const bHasSlot = !!getPublishSlot(b.assignment)
      if (aHasSlot && !bHasSlot) return -1
      if (!aHasSlot && bHasSlot) return 1

      const aWithheld = a.deliverable?.status === 'withheld' && aPublish
      const bWithheld = b.deliverable?.status === 'withheld' && bPublish
      if (aWithheld && bWithheld && aPublish && bPublish) {
        return aPublish.localeCompare(bPublish)
      }
      if (aWithheld) return -1
      if (bWithheld) return 1

      const aStart = getStartTime(a.assignment)
      const bStart = getStartTime(b.assignment)
      if (aStart && bStart) {
        return aStart.localeCompare(bStart)
      }
      return 0
    })
  })

  return response
}
