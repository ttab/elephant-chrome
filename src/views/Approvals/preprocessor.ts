import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { MetricsData, MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import {
  getAssignments,
  getDeliverableLink,
  findIncludedDocument,
  getDocumentStatus
} from '@/lib/documentHelpers'

export type PreprocessedApprovalData = DocumentStateWithDecorators<MetricsDecorator> & {
  _assignment: Block
  _deliverable?: {
    id: string
    status: string
    type: string
    document?: Document
    meta?: DocumentMeta
  }
  id: string
  _preprocessed: {
    planningId: string
    planningTitle: string
    sectionUuid?: string
    sectionTitle?: string
    metrics?: MetricsData
  }
}

/**
 * Flatten planning documents into one row per assignment that has a deliverable.
 * Precomputes commonly accessed fields for rendering.
 */
export function preprocessApprovalData(
  socketData: DocumentStateWithDecorators<MetricsDecorator>[]
): PreprocessedApprovalData[] {
  return socketData.flatMap((docState) => {
    const planning = docState.document
    if (!planning) return []

    const assignments = getAssignments(planning)
    const planningId = planning.uuid || ''
    const planningTitle = planning.title || ''

    return assignments.map((assignment) => {
      const deliverableUuid = getDeliverableLink(assignment)
      const deliverableState = findIncludedDocument(
        docState.includedDocuments,
        deliverableUuid
      )

      const deliverableMetrics = deliverableUuid && docState.decoratorData?.metrics
        ? docState.decoratorData.metrics[deliverableUuid]
        : undefined

      const deliverable = deliverableState?.document
        ? {
            id: deliverableState.document.uuid || '',
            status: getDocumentStatus(deliverableState.meta),
            type: deliverableState.document.type || '',
            document: deliverableState.document,
            meta: deliverableState.meta
          }
        : undefined

      const sectionUuid = deliverable?.document?.links
        ?.find((link) => link.type === 'core/section')?.uuid

      return {
        ...docState,
        _assignment: assignment,
        _deliverable: deliverable,
        id: `${planningId}-${assignment.id}`,
        _preprocessed: {
          planningId,
          planningTitle,
          sectionUuid,
          metrics: deliverableMetrics
        }
      } satisfies PreprocessedApprovalData
    })
  }).filter((item) => item._deliverable?.id)
}
