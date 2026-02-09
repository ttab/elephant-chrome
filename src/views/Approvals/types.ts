import type { Block, Document } from '@ttab/elephant-api/newsdoc'
import type { DocumentMeta } from '@ttab/elephant-api/repository'
import type { DocumentStateWithDecorators } from '@/hooks/useRepositorySocket/types'
import type { MetricsData } from '@/hooks/useRepositorySocket/decorators/metrics'
import {
  getAssignments,
  getDeliverableLink,
  findIncludedDocument,
  getDocumentStatus
} from '@/lib/documentHelpers'

/**
 * Structured representation of an approval item
 * Replaces the flat AssignmentInterface
 */
export interface ApprovalItem {
  // Planning context
  planning: {
    id: string
    title: string
    document?: Document
  }

  // Assignment context
  assignment: Block

  // Deliverable context (optional - may not exist yet)
  deliverable?: {
    id: string
    status: string
    type: string
    document?: Document
    meta?: DocumentMeta
  }
  metrics?: MetricsData
}

/**
 * Extract approval items from DocumentStateWithDecorators
 * Correlates planning documents, assignments, and deliverables
 */
export function extractApprovalItems(
  socketData: DocumentStateWithDecorators<MetricsData>[]
): ApprovalItem[] {
  return socketData.flatMap((docState) => {
    const planning = docState.document
    if (!planning) return []

    const assignments = getAssignments(planning)

    return assignments.map((assignment) => {
      const deliverableUuid = getDeliverableLink(assignment)
      const deliverableState = findIncludedDocument(
        docState.includedDocuments,
        deliverableUuid
      )

      // Get metrics for this specific deliverable UUID from flat structure
      const deliverableMetrics = deliverableUuid && docState.decoratorData
        ? docState.decoratorData[deliverableUuid]
        : undefined

      const item: ApprovalItem = {
        planning: {
          id: planning.uuid || '',
          title: planning.title || '',
          document: planning
        },
        assignment,
        metrics: deliverableMetrics
      }

      if (deliverableState?.document) {
        item.deliverable = {
          id: deliverableState.document.uuid || '',
          status: getDocumentStatus(deliverableState.meta),
          type: deliverableState.document.type || '',
          document: deliverableState.document,
          meta: deliverableState.meta
        }
      }

      return item
    })
  }).filter((item) => item.deliverable?.id) // Only items with deliverables
}
