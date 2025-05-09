import type { Block, Document } from '@ttab/elephant-api/newsdoc'

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
  _statusData?: string
  _metricsData?: {
    charCount?: string
  }
}
