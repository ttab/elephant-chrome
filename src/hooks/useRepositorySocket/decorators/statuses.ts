import type { Decorator, DecoratorDataBase } from '../types'
import type { DocumentStateWithIncludes } from '@/shared/RepositorySocket'
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
  statuses?: string[]
}): Decorator<StatusOverviewItem> {
  const { repository } = options
  const statuses = options.statuses || Object.keys(StatusSpecifications)

  return {
    namespace: 'statuses',

    async onInitialData(documents: DocumentStateWithIncludes[], accessToken: string) {
      const uuids = documents
        .flatMap((d) => d.includedDocuments)
        .map((doc) => doc?.uuid)
        .filter((uuid): uuid is string => !!uuid)

      if (!uuids.length) {
        return new Map()
      }

      return await fetchStatuses(uuids, repository, statuses, accessToken)
    },

    async onUpdate(update: DocumentUpdate, accessToken: string) {
      if (!isInclusionUpdate(update)) {
        return undefined
      }

      const uuid = update.document?.uuid
      if (!uuid) {
        return new Map()
      }

      return await fetchStatuses([uuid], repository, statuses, accessToken)
    }
  }
}

/**
 * Fetches deliverable statuses for all assignments in planning documents
 */
async function fetchStatuses(
  uuids: string[],
  repository: Repository,
  statuses: string[],
  accessToken: string
): Promise<Map<string, StatusOverviewItem>> {
  try {
    const statusesMap = new Map<string, StatusOverviewItem>()
    const chunkSize = 50

    for (let i = 0; i < uuids.length; i += chunkSize) {
      const chunk = uuids.slice(i, i + chunkSize)
      const response = await repository.getStatuses({
        uuids: chunk,
        statuses,
        accessToken
      })

      if (response?.items) {
        for (const documentStatus of response.items) {
          statusesMap.set(documentStatus.uuid, documentStatus)
        }
      }
    }

    if (statusesMap.size === 0 && uuids.length > 0) {
      console.warn('📋 Assignment statuses decorator: No status data returned')
    }

    return statusesMap
  } catch (error) {
    console.warn('📋 Assignment statuses decorator: failed to fetch statuses:', error)
    return new Map()
  }
}
