import { createContext } from 'react'
import type { DocumentType, ActivityId, ActivityDefinition, ActivityEntry } from './types'

export interface DocumentActivityContextValue {
  register: (docType: DocumentType, activityId: ActivityId, definition: ActivityDefinition) => (() => void)
  getEntries: (docType: DocumentType) => ActivityEntry[]
  version: number
}

export const DocumentActivityContext = createContext<DocumentActivityContextValue | null>(null)
