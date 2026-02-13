import type { Decorator, DecoratorDataBase } from '../types'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import { getSession } from 'next-auth/react'
import type { Repository } from '@/shared/Repository'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import { isInclusionUpdate } from '../lib/handlers'

/**
 * Metrics data attached to documents by the metrics decorator.
 * Simplified interface with camelCase properties extracted from API's DocumentMetrics.
 */
export interface MetricsData extends Record<string, number | undefined> {
  charCount?: number
  wordCount?: number
}

/**
 * Namespaced metrics decorator data structure.
 * This is the shape of decoratorData after the metrics decorator is applied.
 */
export interface MetricsDecorator extends DecoratorDataBase {
  metrics: Record<string, MetricsData>
}

/**
 * Creates a metrics decorator that fetches document metrics from the API.
 *
 * This decorator enriches documents with metrics like character count, word count, etc.
 * - On initial fetch: performs batch API call for all documents
 * - On updates: performs single API call for the updated document
 * - Returns flat Map of UUID -> MetricsData
 * - Applied under "metrics" namespace: decoratorData.metrics[uuid]
 *
 * @param options - Configuration options for the metrics decorator
 * @param options.kinds - Array of metric kinds to fetch (e.g., ['char_count', 'word_count'])
 * @param options.repository - Repository instance for making API calls
 * @returns Decorator instance that fetches metrics
 *
 */
export function createMetricsDecorator(options: {
  kinds?: string[]
  repository: Repository
}): Decorator<MetricsData> {
  const { repository, kinds = ['char_count', 'word_count'] } = options

  return {
    namespace: 'metrics',

    /**
     * Fetches metrics for all included documents in a batch.
     *
     * Performs batch API call for all included documents at once.
     * Returns flat Map of UUID -> MetricsData.
     */
    async onInitialData(documents: DocumentStateWithIncludes[]) {
      // Extract UUIDs from included documents only
      const uuids = documents
        .flatMap((d) => d.includedDocuments)
        .map((doc) => doc?.uuid)
        .filter((uuid): uuid is string => !!uuid)

      if (!uuids.length) {
        return new Map()
      }

      return await fetchMetricsForUuids(uuids, repository, kinds)
    },

    /**
     * Fetches metrics for updated included document
     *
     * When an included document updates, re-fetch metrics for it.
     * Returns Map with single entry for the updated document.
     */
    async onUpdate(update: DocumentUpdate) {
      if (!isInclusionUpdate(update)) {
        return undefined
      }

      const uuid = update.document?.uuid
      if (!uuid) {
        return new Map()
      }

      return await fetchMetricsForUuids([uuid], repository, kinds)
    }
  }
}

/**
 * Helper function to fetch metrics for a batch of UUIDs
 */
async function fetchMetricsForUuids(
  uuids: string[],
  repository: Repository,
  kinds: string[]
): Promise<Map<string, MetricsData>> {
  const session = await getSession()
  if (!session?.accessToken) {
    console.warn('📊 Metrics decorator: No access token available')
    return new Map()
  }

  try {
    const response = await repository.getMetrics(
      uuids,
      kinds,
      session.accessToken
    )

    const metricsMap = new Map<string, MetricsData>()

    for (const [uuid, documentMetrics] of Object.entries(response.documents)) {
      const metrics: MetricsData = {}

      for (const metric of documentMetrics.metrics) {
        // Map API metric kinds to camelCase field names
        switch (metric.kind) {
          case 'char_count':
          case 'charcount':
            metrics.charCount = Number(metric.value)
            break
          case 'word_count':
          case 'wordcount':
            metrics.wordCount = Number(metric.value)
            break
        }
      }

      metricsMap.set(uuid, metrics)
    }

    return metricsMap
  } catch (error) {
    console.warn('📊 Metrics decorator: failed to fetch batch metrics:', error)
    return new Map()
  }
}
