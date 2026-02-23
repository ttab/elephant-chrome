import type { DecoratorDataBase, DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { isWithinInterval, parseISO } from 'date-fns'
import type { PreprocessedTableData } from '@/components/Table/types'
import { findIncludedDocument, getAssignments, getNewsvalue, getSection, getDeliverableLink } from '@/lib/documentHelpers'

export type PreprocessedAssignmentData = PreprocessedTableData<DecoratorDataBase, {
  newsvalue?: string
  sectionUuid?: string
  assignmentTitle?: string
  assignmentTypes: string[]
  assigneeUuids: string[]
  deliverableUuid?: string
  deliverableStatus?: string
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
  return (data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedAssignmentData[] => {
    const flattened: PreprocessedAssignmentData[] = []

    for (const doc of data) {
      const uuid = doc.document?.uuid
      if (!uuid) continue

      const assignments = getAssignments(doc.document)

      if (assignments.length === 0) continue

      const newsvalue = getNewsvalue(doc.document)
      const sectionUuid = getSection(doc.document)

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

        const deliverableUuid = getDeliverableLink(assignment)
        const deliverableState = findIncludedDocument(doc.includedDocuments, deliverableUuid)
        const deliverableStatus = deliverableState?.meta?.workflowState

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
            deliverableStatus,
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
