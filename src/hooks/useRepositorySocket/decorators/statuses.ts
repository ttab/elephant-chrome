import type { Decorator, DecoratorDataBase } from '../types'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
import { getSession } from 'next-auth/react'
import type { Repository } from '@/shared/Repository'
import type { DocumentUpdate } from '@ttab/elephant-api/repositorysocket'
import { StatusSpecifications } from '@/defaults/workflowSpecification'
import type { StatusOverviewItem } from '@ttab/elephant-api/repository'
import { isInclusionUpdate } from '../lib/handlers'


export interface StatusDecorator extends DecoratorDataBase {
  statuses: Record<string, StatusOverviewItem>
}

/**
 * Creates an assignment statuses decorator that fetches deliverable status data.
 *
 * This decorator enriches planning documents with status information for their assignment deliverables.
 * It performs a batch fetch on initial load and single updates.
 * Returns flat Map of UUID -> StatusesData
 * Applied under "statuses" namespace: decoratorData.statuses[uuid]
 *
 * @param options - Configuration options
 * @param options.repository - Repository instance for making API calls
 * @returns Decorator instance that fetches deliverables status
 */
export function createStatusesDecorator(options: {
  repository: Repository
}): Decorator<StatusOverviewItem> {
  const { repository } = options

  return {
    namespace: 'statuses',

    async onInitialData(documents: DocumentStateWithIncludes[]) {
      const uuids = documents
        .flatMap((d) => d.includedDocuments)
        .map((doc) => doc?.uuid)
        .filter((uuid): uuid is string => !!uuid)

      if (!uuids.length) {
        return new Map()
      }

      return await fetchStatuses(uuids, repository)
    },

    async onUpdate(update: DocumentUpdate) {
      if (!isInclusionUpdate(update)) {
        return undefined
      }

      const uuid = update.document?.uuid
      if (!uuid) {
        return new Map()
      }

      return await fetchStatuses([uuid], repository)
    }
  }
}

/**
 * Fetches deliverable statuses for all assignments in planning documents
 */
async function fetchStatuses(
  uuids: string[],
  repository: Repository
): Promise<Map<string, StatusOverviewItem>> {
  const session = await getSession()
  if (!session?.accessToken) {
    console.warn('📋 Assignment statuses decorator: No access token available')
    return new Map()
  }

  try {
    const knownStatuses = Object.keys(StatusSpecifications)
    const response = await repository.getStatuses({
      uuids,
      statuses: knownStatuses,
      accessToken: session.accessToken
    })

    if (!response || !response.items) {
      console.warn('📋 Assignment statuses decorator: No status data returned')
      return new Map()
    }

    const statusesMap = new Map<string, StatusOverviewItem>()

    for (const documentStatus of response.items) {
      statusesMap.set(documentStatus.uuid, documentStatus)
    }

    return statusesMap
  } catch (error) {
    console.warn('📋 Assignment statuses decorator: failed to fetch statuses:', error)
    return new Map()
  }
}
