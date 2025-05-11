import type { QueryV1 } from '@ttab/elephant-api/index'
import type { Assignment } from '../schemas/assignments'
import { isWithinInterval, parseISO } from 'date-fns'
import type { Block } from '@ttab/elephant-api/newsdoc'

export function asAssignments(data: Assignment[], query: QueryV1): Assignment[] {
  const queryRange = getQueryRange(query)

  const aggregatedAssignments: Assignment[] = []
  for (const doc of data) {
    const ids = doc.fields['document.meta.core_assignment.id']?.values || []
    for (const id of ids) {
      const currentAssignmentMeta = doc.document?.meta.find((block) => block.id === id)

      if (currentAssignmentMeta && isWithinRange(currentAssignmentMeta.data.start_date, queryRange)) {
        const currentAssignmentType = currentAssignmentMeta?.meta.find((block) => block.type === 'core/assignment-type')?.value
        const currentStart = getStart(currentAssignmentType, currentAssignmentMeta?.data)

        aggregatedAssignments.push({
          id: doc.id,
          sort: doc.sort,
          score: doc.score,
          source: doc.source,
          fields: {
            ...doc.fields,
            'document.start_time.value': {
              values: [currentStart.value]
            },
            'document.start_time.type': {
              values: [currentStart.type]
            },
            'document.meta.core_assignment.id': {
              values: [id]
            },
            'document.meta.core_assignment.title': {
              values: [currentAssignmentMeta.title]
            },
            'document.meta.core_assignment.rel.assignee.title': {
              values: currentAssignmentMeta.links
                .filter((link) => link.type === 'core/author' && link.rel === 'assignee')
                .map((link) => link.title)
            },
            'document.meta.core_assignment.meta.core_assignment_type.value': {
              values: currentAssignmentMeta.meta
                .filter((block) => block.type === 'core/assignment-type')
                .map((block) => block.value)
            },
            'document.meta.core_assignment.rel.deliverable.uuid': {
              values: currentAssignmentMeta.links
                .filter((link) => link.rel === 'deliverable')
                .map((link) => link.uuid)
            },
            'document.meta.core_assignment.data.start': {
              values: [currentAssignmentMeta.data.start]
            },
            'document.meta.core_assignment.data.full_day': {
              values: [currentAssignmentMeta.data.full_day]
            },
            'document.meta.core_assignment.data.publish_slot': {
              values: [currentAssignmentMeta.data.publish_slot]
            }
            /* Dont think we need this?
             * 'document.meta.core_assignment.data.publish': {
              values: [currentAssignmentMeta.data.publish]
            } */
          }
        })
      }
    }
  }

  return sortAssignments(aggregatedAssignments)
}

function isWithinRange(value: string, range: { gte: string, lte: string }) {
  return isWithinInterval(parseISO(value), {
    start: parseISO(range.gte),
    end: parseISO(range.lte)
  })
}

function getQueryRange(query: QueryV1): { gte: string, lte: string } {
  if (query?.conditions.oneofKind === 'bool') {
    const rangeCondition = query.conditions.bool.must.find(
      // FIXME: This is a workaround for the type issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (condition: any) => condition.conditions.oneofKind === 'range'
    )
    if (rangeCondition && rangeCondition.conditions.oneofKind === 'range') {
      return {
        gte: rangeCondition.conditions.range.gte,
        lte: rangeCondition.conditions.range.lte
      }
    }
  }

  throw new Error('Invalid query structure')
}

function getStart(type: string | undefined, data: Block['data']): { value: string, type: string } {
  if (data.full_day === 'true') {
    return { value: 'Heldag', type: 'full_day' }
  }

  switch (type) {
    case 'picture':
    case 'video':
      return { value: data.start, type: 'start' }
    case 'text':
    case 'flash':
    case 'editorial-info':
    case 'graphic':
      // return data.publish_slot || data.publish || data.start
      if (data.publish_slot) {
        return { value: data.publish_slot, type: 'publish_slot' }
      }

      /* I dont think we want to monitor publish here?
       * if (data.publish) {
        return { value: data.publish, type: 'publish' }
      } */

      if (data.start) {
        return { value: data.start, type: 'start' }
      }

      return { value: '??', type: 'unknown' }
    default:
      return { value: data.start, type: 'unknown' }
  }
}

function sortAssignments(arr: Assignment[]): Assignment[] {
  const assureISOString = (assignment: Assignment): string => {
    const type = assignment.fields['document.start_time.type']?.values?.[0]
    const value = assignment.fields['document.start_time.value']?.values?.[0]
    if (type === 'publish_slot' && !isNaN(Number(value))) {
      // Use the assignment's start-of-day ISO string in Europe/Stockholm
      const dayIso = assignment.fields['document.meta.core_assignment.data.start']?.values?.[0]

      if (typeof dayIso === 'string') {
        // Add the hour to the start-of-day ISO string
        const base = new Date(dayIso)
        const hour = Number(value)
        if (!isNaN(base.getTime()) && !isNaN(hour)) {
          base.setHours(hour, 0, 0, 0)
          return base.toISOString()
        }
      }
    }
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }

    // Fallback to epoch start for invalid/missing dates
    return new Date(0).toISOString()
  }

  return arr.sort((a, b) => {
    const aStart = new Date(assureISOString(a)).getTime()
    const bStart = new Date(assureISOString(b)).getTime()
    if (aStart !== bStart) return aStart - bStart

    const aNewsValue = Number(a.fields['document.meta.core_newsvalue.value']?.values?.[0])
    const bNewsValue = Number(b.fields['document.meta.core_newsvalue.value']?.values?.[0])
    return bNewsValue - aNewsValue
  })
}
