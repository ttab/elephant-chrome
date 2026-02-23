import { useContext, useMemo } from 'react'
import { DocumentActivityContext } from './documentActivityContext'
import { useActivityExecutor } from './useActivityExecutor'
import type { ResolvedActivity } from './types'

export function useDocumentActivities(
  docType: string,
  docId: string,
  args?: Record<string, unknown>
): ResolvedActivity[] {
  const context = useContext(DocumentActivityContext)

  if (!context) {
    throw new Error('useDocumentActivities must be used within a DocumentActivityProvider')
  }

  const { executeActivity } = useActivityExecutor()

  return useMemo(() => {
    const entries = context.getEntries(docType)

    return entries.map((entry) => ({
      activityId: entry.activityId,
      title: entry.definition.title,
      icon: entry.definition.icon,
      execute: (options) => {
        executeActivity(entry, docId, args, options)
      }
    }))
  }, [context, docType, docId, args, executeActivity])
}
