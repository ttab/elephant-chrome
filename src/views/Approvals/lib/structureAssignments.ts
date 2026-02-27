import { toZonedTime } from 'date-fns-tz'
import { parseISO, getHours } from 'date-fns'
import type { PreprocessedApprovalData } from '../preprocessor'
import { getTimeValue } from './getTimeValue'

export interface AssignmentResponseInterface {
  key?: string
  label?: string
  hours?: number[]
  items: PreprocessedApprovalData[]
}

/**
 * Split the approval items into the different time slots
 */
export function structureAssignments(
  timeZone: string,
  items: PreprocessedApprovalData[],
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
      items: [] as PreprocessedApprovalData[]
    }
  })

  items.forEach((item) => {
    const status = item._deliverable?.status
    const meta = item._deliverable?.meta
    const hasUsable = meta?.heads.usable?.id

    const publish = item._preprocessed.publishTime
    const start = item._preprocessed.startTime
    const publishSlot = item._preprocessed.publishSlot
    let hour: number | undefined

    if (status === 'withheld' && publish) {
      // When scheduled, we want it in that particular hour.
      hour = getHours(toZonedTime(parseISO(publish), timeZone))
    } else if (hasUsable && meta?.modified) {
      hour = getHours(toZonedTime(parseISO(meta.modified), timeZone))
    } else if (publishSlot) {
      // If assigned a publish slot, then we use that. Publish slot is already an hour.
      hour = parseInt(publishSlot)
    } else if (start) {
      // In all other cases we rely on the start time.
      hour = getHours(toZonedTime(parseISO(start), timeZone))
    }

    let assigned = false
    for (const slot of response) {
      if (typeof hour === 'number' && slot.hours.includes(hour)) {
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
      const aMeta = a._deliverable?.meta
      const bMeta = b._deliverable?.meta
      const aPublish = a._preprocessed.publishTime
      const bPublish = b._preprocessed.publishTime

      if (aMeta && bMeta) {
        const aWithheld = a._deliverable?.status === 'withheld' && aPublish
        const bWithheld = b._deliverable?.status === 'withheld' && bPublish

        if (aWithheld && bWithheld && aPublish && bPublish) {
          return aPublish.localeCompare(bPublish)
        }

        if (aWithheld) return -1
        if (bWithheld) return 1

        return getTimeValue(aMeta?.modified) > getTimeValue(bMeta.modified) ? -1 : 1
      }

      const aHasSlot = !!a._preprocessed.publishSlot
      const bHasSlot = !!b._preprocessed.publishSlot
      if (aHasSlot && !bHasSlot) return -1
      if (!aHasSlot && bHasSlot) return 1

      const aWithheld = a._deliverable?.status === 'withheld' && aPublish
      const bWithheld = b._deliverable?.status === 'withheld' && bPublish
      if (aWithheld && bWithheld && aPublish && bPublish) {
        return aPublish.localeCompare(bPublish)
      }
      if (aWithheld) return -1
      if (bWithheld) return 1

      const aStart = a._preprocessed.startTime
      const bStart = b._preprocessed.startTime
      if (aStart && bStart) {
        return aStart.localeCompare(bStart)
      }
      return 0
    })
  })

  return response
}
