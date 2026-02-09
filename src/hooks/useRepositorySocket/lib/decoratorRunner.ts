import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import type {
  Decorator,
  DocumentStateWithDecorators
} from '../types'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'

/**
 * Runs all decorators sequentially on initial document batch.
 * Each decorator can enrich documents with additional data.
 * Errors are caught and logged silently to prevent blocking.
 *
 * Merges enrichment data from all decorators into a flat UUID-keyed structure,
 * containing only data for documents present in the document state.
 *
 * @param documents - Initial batch of documents from WebSocket
 * @param decorators - Array of decorators to run sequentially
 * @returns Documents with decorator data merged in
 *
 * @example
 * ```typescript
 * const enriched = await runInitialDecorators(documents, [
 *   metricsDecorator,
 *   assignmentDecorator
 * ])
 * // enriched[0].decoratorData = {
 * //   "uuid-123": { charCount: 1000, wordCount: 200 },
 * //   "uuid-456": { charCount: 500, wordCount: 100 }
 * // }
 * ```
 */
export async function runInitialDecorators<TEnrichment = unknown>(
  documents: DocumentStateWithIncludes[],
  decorators: Decorator<TEnrichment>[]
): Promise<DocumentStateWithDecorators<TEnrichment>[]> {
  if (!decorators.length) {
    return documents as DocumentStateWithDecorators<TEnrichment>[]
  }

  // Create new array with shallow copies to ensure React detects state changes
  const enrichedDocs = documents.map((doc) => ({ ...doc })) as DocumentStateWithDecorators<TEnrichment>[]

  // Run each decorator sequentially
  for (const decorator of decorators) {
    if (!decorator.onInitialData) {
      continue
    }

    try {
      const decoratorDataMap = await decorator.onInitialData(documents)

      // Merge decorator data into each document's decoratorData
      // Only include UUIDs that exist in this document state
      for (const doc of enrichedDocs) {
        // Get all UUIDs present in this document state
        const allUuids = [
          doc.document?.uuid,
          ...(doc.includedDocuments?.map((d) => d?.uuid).filter(Boolean) || [])
        ].filter((uuid): uuid is string => !!uuid)

        // Initialize decoratorData if not present
        if (!doc.decoratorData && allUuids.some((uuid) => decoratorDataMap.has(uuid))) {
          doc.decoratorData = {} as Record<string, TEnrichment>
        }

        // Merge enrichment data for UUIDs present in this document state
        for (const uuid of allUuids) {
          const enrichment = decoratorDataMap.get(uuid)
          if (enrichment !== undefined) {
            doc.decoratorData![uuid] = enrichment
          }
        }
      }
    } catch (error) {
      // Silent failure - log but don't throw
      console.error('🎨 Decorator failed silently:', error)
    }
  }

  return enrichedDocs
}

/**
 * Runs all decorators sequentially on a single updated document.
 * Each decorator can enrich the document with additional data.
 * Errors are caught and logged silently to prevent blocking.
 *
 * Updates the flat UUID-keyed structure with enrichment for the updated document.
 *
 * @param document - Updated document from WebSocket
 * @param decorators - Array of decorators to run sequentially
 * @returns Document with decorator data merged in
 *
 * @example
 * ```typescript
 * const enriched = await runUpdateDecorators(document, [
 *   metricsDecorator,
 *   assignmentDecorator
 * ])
 * // enriched.decoratorData["uuid-123"] = { charCount: 1100, wordCount: 210 }
 * ```
 */
export async function runUpdateDecorators<TEnrichment = unknown>(
  parent: DocumentStateWithDecorators<TEnrichment>,
  update: DocumentUpdate,
  decorators: Decorator<TEnrichment>[]
): Promise<DocumentStateWithDecorators<TEnrichment>> {
  if (!decorators.length) {
    return parent
  }

  // Create shallow copy to ensure React detects state changes
  const enrichedDoc = { ...parent }

  // Get the UUID of the updated document
  const uuid = update.document?.uuid
  if (!uuid) {
    return enrichedDoc
  }

  // Run each decorator sequentially
  for (const decorator of decorators) {
    if (!decorator.onUpdate) {
      continue
    }

    try {
      const enrichment = await decorator.onUpdate(update)
      if (enrichment !== undefined) {
        // Handle both Map and single enrichment value
        if (enrichment instanceof Map) {
          const mapValue = enrichment.get(uuid)
          if (mapValue !== undefined) {
            enrichedDoc.decoratorData = { ...enrichedDoc.decoratorData, [uuid]: mapValue }
          }
        } else {
          enrichedDoc.decoratorData = { ...enrichedDoc.decoratorData, [uuid]: enrichment }
        }
      }

      // If no enrichment, leave as is
    } catch (error) {
      console.warn('Update decorator failed silently:', error)
    }
  }

  return enrichedDoc
}
