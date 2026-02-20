import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { StatusDecorator } from '@/hooks/useRepositorySocket/decorators/statuses'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { isWithinInterval, parseISO } from 'date-fns'
import type { PreprocessedTableData } from '@/components/Table/types'

export type PreprocessedAssignmentData = PreprocessedTableData<StatusDecorator, {
  newsvalue?: string
  sectionUuid?: string
  assignmentTitle?: string
  assignmentTypes: string[]
  assigneeUuids: string[]
  deliverableUuid?: string
  startValue?: string
  startType?: string
}> & {
  _assignment?: Block
  _assignmentIndex?: number
}

/**
 * Creates a preprocessor that flattens planning documents into individual
 * assignment rows and precomputes commonly accessed fields.
 *
 * For each document with N assignments within the date range,
 * creates N separate rows with precomputed data for table rendering.
 */
export function createAssignmentPreprocessor(range: { gte: string, lte: string }) {
  return (data: DocumentStateWithDecorators<StatusDecorator>[]): PreprocessedAssignmentData[] => {
    const flattened: PreprocessedAssignmentData[] = []

    for (const doc of data) {
      const uuid = doc.document?.uuid
      if (!uuid) continue

      const assignments = doc.document?.meta?.filter(
        (block: Block) => block.type === 'core/assignment'
      ) || []

      if (assignments.length === 0) continue

      // Precompute document-level fields once per document
      const newsvalue = doc.document?.meta?.find((d) => d.type === 'core/newsvalue')?.value
      const sectionUuid = doc.document?.links
        ?.find((d) => d.type === 'core/section')?.uuid

      assignments.forEach((assignment: Block, index: number) => {
        if (!isWithinRange(assignment.data.start_date, range)) {
          return
        }

        // Precompute assignment-level fields
        const assignmentTypes = assignment.meta
          ?.filter((meta) => meta.type === 'core/assignment-type')
          .map((meta) => meta.value) || []

        const assigneeUuids = assignment.links
          ?.filter((link) => link.type === 'core/author' && link.rel === 'assignee')
          .map((link) => link.uuid) || []

        const deliverableUuid = assignment.links
          ?.find((link) => link.rel === 'deliverable')?.uuid

        const { value: startValue, type: startType } = getStart(
          assignmentTypes[0],
          assignment.data || {}
        )

        flattened.push({
          ...doc,
          _assignment: assignment,
          _assignmentIndex: index,
          id: `${uuid}-assignment-${index}`,
          _preprocessed: {
            newsvalue,
            sectionUuid,
            assignmentTitle: assignment.title,
            assignmentTypes,
            assigneeUuids,
            deliverableUuid,
            startValue,
            startType
          }
        })
      })
    }

    return flattened
  }
}

function isWithinRange(value: string, range: { gte: string, lte: string }): boolean {
  if (!value) {
    return false
  }

  return isWithinInterval(parseISO(value), {
    start: parseISO(range.gte),
    end: parseISO(range.lte)
  })
}

function getStart(type: string | undefined, data: Block['data']): { value: string, type: string } {
  if (data.full_day === 'true') {
    return { value: 'Heldag', type: 'full_day' }
  }

  switch (type) {
    case 'picture':
    case 'video':
      if (data.start) {
        return { value: data.start, type: 'start' }
      }
      return { value: '??', type: 'unknown' }
    case 'text':
    case 'flash':
    case 'editorial-info':
    case 'graphic':
      if (data.publish_slot) {
        return { value: data.publish_slot, type: 'publish_slot' }
      }
      if (data.start) {
        return { value: data.start, type: 'start' }
      }
      return { value: '??', type: 'unknown' }
    default:
      if (data.start) {
        return { value: data.start, type: 'unknown' }
      }
      return { value: '??', type: 'unknown' }
  }
}
