import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import type {
  Decorator,
  DocumentStateWithDecorators,
  DecoratorDataBase
} from '../types'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'

/**
 * Runs all decorators sequentially on initial document batch.
 * Each decorator can enrich documents with additional data under its namespace.
 * Errors are caught and logged silently to prevent blocking.
 *
 * Merges enrichment data from all decorators into a namespaced structure,
 * containing only data for documents present in the document state.
 *
 * @param documents - Initial batch of documents from WebSocket
 * @param decorators - Array of decorators to run sequentially
 * @returns Documents with decorator data merged in
 *
 * @example
 * ```typescript
 * const enriched = await runInitialDecorators(documents, [
 *   metricsDecorator
 * ])
 * // enriched[0].decoratorData = {
 * //   metrics: {
 * //     "uuid-123": { charCount: 1000, wordCount: 200 },
 * //     "uuid-456": { charCount: 500, wordCount: 100 }
 * //   }
 * // }
 * ```
 */
export async function runInitialDecorators<TDecoratorData extends DecoratorDataBase = DecoratorDataBase>(
  documents: DocumentStateWithIncludes[],
  decorators: Array<Decorator<object>>,
  accessToken: string
): Promise<DocumentStateWithDecorators<TDecoratorData>[]> {
  if (!decorators.length) {
    return documents as DocumentStateWithDecorators<TDecoratorData>[]
  }

  // Create new array with shallow copies to ensure React detects state changes
  const enrichedDocs = documents.map((doc) => ({
    ...doc
  })) as DocumentStateWithDecorators<TDecoratorData>[]

  // Run each decorator sequentially
  for (const decorator of decorators) {
    if (!decorator.onInitialData) {
      continue
    }

    try {
      const decoratorDataMap = await decorator.onInitialData(documents, accessToken)

      // Merge decorator data into each document's decoratorData
      // Apply under decorator's namespace: decoratorData[namespace][uuid] = enrichment
      for (const doc of enrichedDocs) {
        // Get all UUIDs present in this document state
        const allUuids = [
          doc.document?.uuid,
          ...(doc.includedDocuments?.map((d) => d?.uuid).filter(Boolean) || [])
        ].filter((uuid): uuid is string => !!uuid)

        // Check if any enrichment data exists for this document's UUIDs
        const hasEnrichment = allUuids.some((uuid) => decoratorDataMap.has(uuid))
        if (!hasEnrichment) {
          continue
        }

        // Initialize decoratorData if not present
        if (!doc.decoratorData) {
          doc.decoratorData = {} as TDecoratorData
        }

        // Initialize namespace object if not present
        const namespace = decorator.namespace
        const decoratorData = doc.decoratorData as DecoratorDataBase
        if (!decoratorData[namespace]) {
          decoratorData[namespace] = {}
        }

        // Merge enrichment data under namespace for UUIDs present in this document state
        for (const uuid of allUuids) {
          const enrichment = decoratorDataMap.get(uuid)
          if (enrichment !== undefined) {
            decoratorData[namespace][uuid] = enrichment
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
 * Each decorator can enrich the document with additional data under its namespace.
 * Errors are caught and logged silently to prevent blocking.
 *
 * Updates the namespaced structure with enrichment for the updated document.
 *
 * @param parent - Parent document state with existing decorator data
 * @param document - Updated document from WebSocket
 * @param decorators - Array of decorators to run sequentially
 * @returns Document with decorator data merged in
 *
 * @example
 * ```typescript
 * const enriched = await runUpdateDecorators(parent, update, [
 *   metricsDecorator
 * ])
 * // enriched.decoratorData = {
 * //   metrics: {
 * //     "uuid-123": { charCount: 1100, wordCount: 210 }
 * //   }
 * // }
 * ```
 */
export async function runUpdateDecorators<TDecoratorData extends DecoratorDataBase = DecoratorDataBase>(
  parent: DocumentStateWithDecorators<TDecoratorData>,
  update: DocumentUpdate,
  decorators: Array<Decorator<object>>,
  accessToken: string
): Promise<DocumentStateWithDecorators<TDecoratorData>> {
  if (!decorators.length) {
    return parent
  }

  // Create shallow copy to ensure React detects state changes
  // Also shallow-copy decoratorData and nested namespace objects to prevent shared references
  const enrichedDoc = {
    ...parent,
    decoratorData: parent.decoratorData
      ? Object.fromEntries(
        Object.entries(parent.decoratorData).map(([key, value]) => [
          key,
          typeof value === 'object' && value !== null ? { ...value } : value
        ])
      )
      : undefined
  } as DocumentStateWithDecorators<TDecoratorData>

  // Get the document UUID from the update
  const documentUuid = update.document?.uuid
  if (!documentUuid) {
    return enrichedDoc
  }

  // Run each decorator sequentially
  for (const decorator of decorators) {
    if (!decorator.onUpdate) {
      continue
    }

    try {
      const enrichment = await decorator.onUpdate(update, accessToken)
      if (enrichment !== undefined) {
        // Initialize decoratorData if not present
        if (!enrichedDoc.decoratorData) {
          enrichedDoc.decoratorData = {} as TDecoratorData
        }

        const namespace = decorator.namespace
        const decoratorData = enrichedDoc.decoratorData as DecoratorDataBase

        // Initialize namespace object if not present
        if (!decoratorData[namespace]) {
          decoratorData[namespace] = {}
        }

        // Handle Map return type - extract value for the updated document UUID
        if (enrichment instanceof Map) {
          const enrichmentForDoc = enrichment.get(documentUuid)
          if (enrichmentForDoc !== undefined) {
            decoratorData[namespace][documentUuid] = enrichmentForDoc
          }
          // If Map has no entry for this UUID, preserve existing data (do nothing)
        } else {
          // Handle plain object return - assign it to the document UUID under namespace
          decoratorData[namespace][documentUuid] = enrichment
        }
      }
    } catch (error) {
      console.warn('Update decorator failed silently:', error)
    }
  }

  return enrichedDoc
}
