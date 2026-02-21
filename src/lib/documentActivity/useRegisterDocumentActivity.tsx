import { useEffect, useContext } from 'react'
import { DocumentActivityContext } from './documentActivityContext'
import type { DocumentType, ActivityId, ActivityDefinition } from './types'

export function useRegisterDocumentActivity(
  docType: DocumentType,
  activityId: ActivityId,
  definition: ActivityDefinition
): void {
  const context = useContext(DocumentActivityContext)

  if (!context) {
    throw new Error('useRegisterDocumentActivity must be used within a DocumentActivityProvider')
  }

  const { register } = context

  useEffect(() => {
    return register(docType, activityId, definition)
  }, [register, docType, activityId, definition])
}
