import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { MetricsData, MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
interface PreprocessedTableData<
  TDecorator,
  TPreprocessed extends Record<string, unknown>
> extends DocumentStateWithDecorators<TDecorator> {
  id: string
  _preprocessed: TPreprocessed
}
import {
  getAssignments,
  getDeliverableLink,
  findIncludedDocument,
  getDocumentStatus,
  getSection
} from '@/lib/documentHelpers'
import { fromSubset, allFromSubset } from '@/lib/subsetHelpers'

export const APPROVALS_SUBSET = [
  '.meta(type=\'core/newsvalue\')@{value}',
  '.links(type=\'core/section\')@{uuid}',
  '.links(type=\'core/section\')@{title}',
  '.meta(type=\'core/assignment\')@{title}',
  '.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid}',
  '@{title}',
  '.meta(type=\'core/assignment\').data{start}',
  '.meta(type=\'core/assignment\').data{publish_slot}',
  '.meta(type=\'core/assignment\').data{publish}',
  '.meta(type=\'core/assignment\').meta(type=\'tt/slugline\')@{value}',
  '.meta(type=\'core/planning-item\').data{start_date}',
  '.meta(type=\'core/assignment\').data{start_date}'
] as const

const enum E {
  Newsvalue,
  SectionUuid,
  SectionTitle,
  AssignmentTitle,
  DeliverableUuids,
  Title,
  Start,
  PublishSlot,
  Publish,
  Slugline,
  PlanningStartDate,
  AssignmentStartDate
}

export type PreprocessedApprovalData = PreprocessedTableData<MetricsDecorator, {
  planningId: string
  planningTitle: string
  sectionUuid?: string
  metrics?: MetricsData
  publishSlot?: string
  startTime?: string
  publishTime?: string
  slugline?: string
}> & {
  _assignment?: Block
  _deliverable?: {
    id: string
    status: string
    type: string
    document?: Document
    meta?: DocumentMeta
  }
}

interface ExtractedAssignment {
  deliverableUuid?: string
  assignment?: Block
  id: string
  publishSlot?: string
  startTime?: string
  startDate?: string
  publishTime?: string
  slugline?: string
  sectionUuid?: string
}

/**
 * Flatten planning documents into one row per assignment that has
 * a deliverable. Precomputes commonly accessed fields for rendering.
 *
 * Skips assignments where the planning is not on `dateStr` and the
 * assignment is either slot-scheduled or also not on `dateStr`. Mirrors
 * the rule in `src/hooks/index/lib/assignments/fetchAssignments.ts`.
 */
export function preprocessApprovalData(
  socketData: DocumentStateWithDecorators<MetricsDecorator>[],
  dateStr: string
): PreprocessedApprovalData[] {
  return socketData.flatMap((docState) => {
    const { subset } = docState
    const planningId = docState.uuid || docState.document?.uuid || ''
    if (!planningId) return []

    const planningTitle = fromSubset(subset, E.Title)
      ?? docState.document?.title ?? ''

    const planningStartDate = subset?.length
      ? fromSubset(subset, E.PlanningStartDate)
      : docState.document?.meta.find((m) => m.type === 'core/planning-item')?.data?.start_date
    const sameDay = planningStartDate === dateStr

    const items = subset?.length
      ? extractFromSubset(subset, planningId)
      : extractFromDocument(docState.document, planningId)

    return items.flatMap((item) => {
      const sameDayAssignment = item.startDate === dateStr
      if (!sameDay && (!!item.publishSlot || !sameDayAssignment)) {
        return []
      }

      const deliverableState = findIncludedDocument(
        docState.includedDocuments, item.deliverableUuid
      )

      return [{
        ...docState,
        _assignment: item.assignment,
        _deliverable: buildDeliverable(
          item.deliverableUuid, deliverableState
        ),
        id: item.id,
        _preprocessed: {
          planningId,
          planningTitle,
          sectionUuid: getSection(deliverableState?.document)
            ?? item.sectionUuid,
          metrics: getMetrics(docState, item.deliverableUuid),
          publishSlot: item.publishSlot,
          startTime: item.startTime,
          publishTime: item.publishTime,
          slugline: item.slugline
        }
      }]
    })
  }).filter((item) => item._deliverable?.id)
}

function extractFromSubset(
  subset: NonNullable<DocumentStateWithDecorators['subset']>,
  planningId: string
): ExtractedAssignment[] {
  const deliverableUuids = allFromSubset(subset, E.DeliverableUuids)
  const starts = allFromSubset(subset, E.Start)
  const startDates = allFromSubset(subset, E.AssignmentStartDate)
  const publishSlots = allFromSubset(subset, E.PublishSlot)
  const publishes = allFromSubset(subset, E.Publish)
  const sluglines = allFromSubset(subset, E.Slugline)
  const sectionUuid = fromSubset(subset, E.SectionUuid)

  return deliverableUuids.map((uuid, i) => ({
    deliverableUuid: uuid,
    id: `${planningId}-assignment-${i}`,
    publishSlot: publishSlots[i],
    startTime: starts[i],
    startDate: startDates[i],
    publishTime: publishes[i],
    slugline: sluglines[i],
    sectionUuid
  }))
}

function extractFromDocument(
  planning: Document | undefined,
  planningId: string
): ExtractedAssignment[] {
  const assignments = getAssignments(planning)
  const planningSectionUuid = getSection(planning)

  return assignments.map((assignment) => ({
    deliverableUuid: getDeliverableLink(assignment),
    assignment,
    id: `${planningId}-${assignment.id}`,
    publishSlot: assignment.data?.publish_slot,
    startTime: assignment.data?.start,
    startDate: assignment.data?.start_date,
    publishTime: assignment.data?.publish,
    slugline: assignment.meta
      .find((m) => m.type === 'tt/slugline')?.value,
    sectionUuid: planningSectionUuid
  }))
}

function buildDeliverable(
  uuid: string | undefined,
  state: ReturnType<typeof findIncludedDocument>
): PreprocessedApprovalData['_deliverable'] {
  if (!uuid) return undefined

  return {
    id: uuid,
    status: state?.meta ? getDocumentStatus(state.meta) : 'draft',
    type: state?.document?.type || '',
    document: state?.document,
    meta: state?.meta
  }
}

function getMetrics(
  docState: DocumentStateWithDecorators<MetricsDecorator>,
  deliverableUuid: string | undefined
): MetricsData | undefined {
  if (!deliverableUuid || !docState.decoratorData?.metrics) {
    return undefined
  }
  return docState.decoratorData.metrics[deliverableUuid]
}
