import type { StatusData } from '@/types/index'
import type { Block, Document } from '@ttab/elephant-api/newsdoc'

/**
 * @deprecated Use ApprovalItem from @/views/Approvals/types instead.
 * This interface will be removed in a future version.
 *
 * AssignmentInterface was a flat structure with underscore-prefixed fields
 * that transformed DocumentStateWithIncludes into a legacy format.
 *
 * Migrate to using:
 * - ApprovalItem for Approvals view
 * - DocumentStateWithIncludes directly for other views
 * - documentHelpers from @/lib/documentHelpers for data access
 */
export interface AssignmentInterface extends Block {
  _planningId: string
  _planningTitle: string
  _id: string
  _deliverableId: string
  _deliverableStatus?: string
  _deliverableType?: string
  _deliverableDocument?: Document
  _title: string
  _newsvalue?: string
  _section?: string
  _statusData?: StatusData
  _metricsData?: {
    charCount?: string
  }
}
