import type { DecoratorDataBase, DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { isWithinInterval, parseISO } from 'date-fns'
import type { PreprocessedTableData } from '@/components/Table/types'
import { findIncludedDocument, getAssignments, getDocumentStatus, getNewsvalue, getSection, getDeliverableLink } from '@/lib/documentHelpers'
import { fromSubset, allFromSubset } from '@/lib/subsetHelpers'

export const ASSIGNMENTS_SUBSET = [
  '.meta(type=\'core/newsvalue\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.meta(type=\'core/assignment\')@{title}',
  '.meta(type=\'core/assignment\').meta(type=\'core/assignment-type\')@{value}',
  '.meta(type=\'core/assignment\').links(type=\'core/author\' rel=\'assignee\')@{uuid}',
  '.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid}',
  '.meta(type=\'core/assignment\').data{start_date}',
  '.meta(type=\'core/assignment\').data{start}',
  '.meta(type=\'core/assignment\').data{publish_slot}',
  '.meta(type=\'core/assignment\').data{full_day}',
  '@{title}'
] as const

const enum E {
  Newsvalue,
  SectionUuid,
  AssignmentTitle,
  AssignmentTypes,
  AssigneeUuids,
  DeliverableUuids,
  StartDate,
  Start,
  PublishSlot,
  FullDay,
  Title
}

export type PreprocessedAssignmentData = PreprocessedTableData<DecoratorDataBase, {
  title?: string
  newsvalue?: string
  sectionUuid?: string
  assignmentTitle?: string
  assignmentTypes: string[]
  assigneeUuids: string[]
  deliverableUuid?: string
  deliverableType?: string
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
  const parsedRange = {
    start: parseISO(range.gte),
    end: parseISO(range.lte)
  }

  return (data: DocumentStateWithDecorators<DecoratorDataBase>[]): PreprocessedAssignmentData[] => {
    const flattened: PreprocessedAssignmentData[] = []

    for (const doc of data) {
      const { uuid, subset } = doc
      if (!uuid) continue

      const title = fromSubset(subset, E.Title) ?? doc.document?.title
      const newsvalue = fromSubset(subset, E.Newsvalue) ?? getNewsvalue(doc.document)
      const sectionUuid = fromSubset(subset, E.SectionUuid) ?? getSection(doc.document)

      if (subset?.length) {
        flattenFromSubset(
          flattened, doc, subset, uuid, title, newsvalue, sectionUuid, parsedRange
        )
      } else {
        flattenFromDocument(
          flattened, doc, uuid, title, newsvalue, sectionUuid, parsedRange
        )
      }
    }

    return flattened
  }
}

function flattenFromSubset(
  flattened: PreprocessedAssignmentData[],
  doc: DocumentStateWithDecorators<DecoratorDataBase>,
  subset: NonNullable<DocumentStateWithDecorators['subset']>,
  uuid: string,
  title: string | undefined,
  newsvalue: string | undefined,
  sectionUuid: string | undefined,
  parsedRange: { start: Date, end: Date }
): void {
  const startDates = allFromSubset(subset, E.StartDate)
  const assignmentTitles = allFromSubset(subset, E.AssignmentTitle)
  const assignmentTypes = allFromSubset(subset, E.AssignmentTypes)
  const assigneeUuids = allFromSubset(subset, E.AssigneeUuids)
  const deliverableUuids = allFromSubset(subset, E.DeliverableUuids)
  const starts = allFromSubset(subset, E.Start)
  const publishSlots = allFromSubset(subset, E.PublishSlot)
  const fullDays = allFromSubset(subset, E.FullDay)

  for (let i = 0; i < startDates.length; i++) {
    if (!isWithinRange(startDates[i], parsedRange)) continue

    const deliverableUuid = deliverableUuids[i]
    const deliverableState = findIncludedDocument(
      doc.includedDocuments, deliverableUuid
    )

    const data: Record<string, string> = {}
    if (startDates[i]) data.start_date = startDates[i]
    if (starts[i]) data.start = starts[i]
    if (publishSlots[i]) data.publish_slot = publishSlots[i]
    if (fullDays[i]) data.full_day = fullDays[i]

    const { value: startValue, type: startType } = getStart(
      assignmentTypes[i], data
    )

    flattened.push({
      ...doc,
      _assignmentIndex: i,
      id: `${uuid}-assignment-${i}`,
      _preprocessed: {
        title,
        newsvalue,
        sectionUuid,
        assignmentTitle: assignmentTitles[i],
        assignmentTypes: assignmentTypes[i] ? [assignmentTypes[i]] : [],
        assigneeUuids: assigneeUuids[i] ? [assigneeUuids[i]] : [],
        deliverableUuid,
        deliverableType: deliverableState?.document?.type,
        deliverableStatus: getDocumentStatus(deliverableState?.meta),
        startValue,
        startType
      }
    })
  }
}

function flattenFromDocument(
  flattened: PreprocessedAssignmentData[],
  doc: DocumentStateWithDecorators<DecoratorDataBase>,
  uuid: string,
  title: string | undefined,
  newsvalue: string | undefined,
  sectionUuid: string | undefined,
  parsedRange: { start: Date, end: Date }
): void {
  const assignments = getAssignments(doc.document)
  if (assignments.length === 0) return

  assignments.forEach((assignment: Block, index: number) => {
    if (!isWithinRange(assignment.data.start_date, parsedRange)) return

    const assignmentTypes = assignment.meta
      ?.filter((meta) => meta.type === 'core/assignment-type')
      .map((meta) => meta.value) || []

    const assigneeUuids = assignment.links
      ?.filter((link) => link.type === 'core/author' && link.rel === 'assignee')
      .map((link) => link.uuid) || []

    const deliverableUuid = getDeliverableLink(assignment)
    const deliverableState = findIncludedDocument(
      doc.includedDocuments, deliverableUuid
    )

    const { value: startValue, type: startType } = getStart(
      assignmentTypes[0], assignment.data || {}
    )

    flattened.push({
      ...doc,
      _assignment: assignment,
      _assignmentIndex: index,
      id: `${uuid}-assignment-${index}`,
      _preprocessed: {
        title,
        newsvalue,
        sectionUuid,
        assignmentTitle: assignment.title,
        assignmentTypes,
        assigneeUuids,
        deliverableUuid,
        deliverableType: deliverableState?.document?.type,
        deliverableStatus: getDocumentStatus(deliverableState?.meta),
        startValue,
        startType
      }
    })
  })
}

function isWithinRange(value: string, range: { start: Date, end: Date }): boolean {
  if (!value) {
    return false
  }

  return isWithinInterval(parseISO(value), range)
}

function getStart(type: string | undefined, data: Record<string, string>): { value: string, type: string } {
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
