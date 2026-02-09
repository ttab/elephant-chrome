import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'

/**
 * Decorator function that enriches documents with additional information.
 *
 * Decorators run sequentially after initial document fetch and on updates.
 * They can fetch additional data from APIs or transform existing data.
 *
 * Returns enrichment data keyed by document UUID, containing data only for
 * documents that exist in the document state (main document or includedDocuments).
 *
 * @template TEnrichment The type of enrichment data for ONE document
 *
 * @example
 * ```typescript
 * const metricsDecorator: Decorator<MetricsData> = {
 *   onInitialData: async (documents) => {
 *     const uuids = documents.flatMap(d =>
 *       [d.document?.uuid, ...d.includedDocuments?.map(i => i.uuid)]
 *     ).filter(Boolean)
 *     const metrics = await fetchMetricsBatch(uuids)
 *     // Returns Map<uuid, MetricsData>
 *     return new Map(metrics.map(m => [m.uuid, { charCount: m.chars, wordCount: m.words }]))
 *   },
 *   onUpdate: async (document) => {
 *     const uuid = document.document?.uuid
 *     if (!uuid) return undefined
 *     const metrics = await fetchMetricsSingle(uuid)
 *     return { charCount: metrics.chars, wordCount: metrics.words }
 *   }
 * }
 * ```
 */
export interface Decorator<TEnrichment = unknown> {
  /**
   * Called once after initial document batch is received.
   * Should return a Map where:
   * - Keys are document UUIDs (main document or included documents)
   * - Values are enrichment data for that specific document
   *
   * Only include UUIDs that exist in the documents batch.
   * Runs sequentially with other decorators.
   *
   * @param documents - The initial batch of documents
   * @returns Promise resolving to Map of UUID to enrichment data
   */
  onInitialData?: (
    documents: DocumentStateWithIncludes[]
  ) => Promise<Map<string, TEnrichment>>

  /**
   * Called when a document update is received.
   * Can return either:
   * - Single enrichment data for the main document
   * - Map of enrichment data keyed by UUID for batch updates (e.g., included documents)
   *
   * Runs sequentially with other decorators.
   *
   * @param document - The updated document
   * @returns Promise resolving to enrichment data for this document or Map of enrichments
   */
  onUpdate?: (
    update: DocumentUpdate
  ) => Promise<TEnrichment | Map<string, TEnrichment> | undefined>
}

/**
 * Configuration for decorators passed to useRepositorySocket.
 * Array of decorators that will be executed sequentially.
 */
export type DecoratorConfig<TEnrichment = unknown> = Decorator<TEnrichment>[]

/**
 * Document state extended with decorator enrichment data.
 *
 * decoratorData is a flat Record keyed by document UUID, containing
 * enrichment data only for documents present in this document state
 * (the main document and/or any included documents).
 *
 * @template TEnrichment The type of enrichment data for each document
 *
 * @example
 * ```typescript
 * interface MetricsData {
 *   charCount: number
 *   wordCount: number
 * }
 *
 * const data: DocumentStateWithDecorators<MetricsData>[] = ...
 *
 * // Access main document enrichment
 * const mainMetrics = data[0].decoratorData?.[data[0].document?.uuid]
 * // Type: MetricsData | undefined
 *
 * // Access included document enrichment
 * const deliverableMetrics = data[0].decoratorData?.[deliverableUuid]
 * // Type: MetricsData | undefined
 * ```
 */
export interface DocumentStateWithDecorators<TEnrichment = unknown>
  extends DocumentStateWithIncludes {
  /**
   * Enrichment data keyed by document UUID.
   * Can contain data for the main document and/or any included documents.
   * Populated asynchronously after initial document fetch.
   *
   * Only contains entries for documents that exist in this document state.
   */
  decoratorData?: Record<string, TEnrichment>
}
