import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { MetricsData, MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import type { PreprocessedTableData } from '@/components/Table/types'
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
  '.meta(type=\'core/assignment\').meta(type=\'tt/slugline\')@{value}'
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
  Slugline
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
  publishTime?: string
  slugline?: string
  sectionUuid?: string
}

/**
 * Flatten planning documents into one row per assignment that has
 * a deliverable. Precomputes commonly accessed fields for rendering.
 */
export function preprocessApprovalData(
  socketData: DocumentStateWithDecorators<MetricsDecorator>[]
): PreprocessedApprovalData[] {
  return socketData.flatMap((docState) => {
    const { subset } = docState
    const planningId = docState.uuid || docState.document?.uuid || ''
    if (!planningId) return []

    const planningTitle = fromSubset(subset, E.Title)
      ?? docState.document?.title ?? ''

    const items = subset?.length
      ? extractFromSubset(subset, planningId)
      : extractFromDocument(docState.document, planningId)

    return items.map((item) => {
      const deliverableState = findIncludedDocument(
        docState.includedDocuments, item.deliverableUuid
      )

      return {
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
      }
    })
  }).filter((item) => item._deliverable?.id)
}

function extractFromSubset(
  subset: NonNullable<DocumentStateWithDecorators['subset']>,
  planningId: string
): ExtractedAssignment[] {
  const deliverableUuids = allFromSubset(subset, E.DeliverableUuids)
  const starts = allFromSubset(subset, E.Start)
  const publishSlots = allFromSubset(subset, E.PublishSlot)
  const publishes = allFromSubset(subset, E.Publish)
  const sluglines = allFromSubset(subset, E.Slugline)
  const sectionUuid = fromSubset(subset, E.SectionUuid)

  return deliverableUuids.map((uuid, i) => ({
    deliverableUuid: uuid,
    id: `${planningId}-assignment-${i}`,
    publishSlot: publishSlots[i],
    startTime: starts[i],
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
