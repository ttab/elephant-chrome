import useSWR from 'swr'
import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import { useRepositoryEvents } from '../useRepositoryEvents'
import type { AssignmentInterface } from './lib/assignments/types'
import { fetchAssignments } from './lib/assignments/fetchAssignments'
import type { AssignmentResponseInterface } from './lib/assignments/structureAssignments'
import { structureAssignments } from './lib/assignments/structureAssignments'
import type { Facets } from './lib/assignments/filterAssignments'
import { filterAssignments, getFacets } from './lib/assignments/filterAssignments'
import type { Planning } from '@/shared/schemas/planning'
import { useInitFilters } from '../useInitFilters'
import { columnFilterToQuery } from '@/lib/loadFilters'
import { useIsOnline } from '../useIsOnline'

export { AssignmentInterface }

const defaultStatuses = ['draft', 'done', 'approved', 'withheld']

/**
 * Fetch all assignments in specific date as Block[] extended with some planning level data.
 * Allows optional filtering by type and optional sorting into buckets.
 */
export const useAssignments = ({
  date,
  type,
  dateType = 'start-date',
  slots,
  status,
  requireDeliverable = false,
  requireMetrics = null
}: {
  date: Date
  dateType?: 'start-date' | 'combined-date'
  type?: string | string[]
  requireDeliverable?: boolean
  requireMetrics?: string[] | null
  status?: string[]
  slots?: {
    key: string
    label: string
    hours: number[]
  }[]
}): [AssignmentResponseInterface[], Facets] => {
  const { data: session } = useSession()
  const { index, repository, timeZone } = useRegistry()
  const isOnline = useIsOnline()

  const key = type ? `core/assignment/${type.toString()}/${date.toString()}` : 'core/assignment'

  // This hook is currently only used for the Approvals view, so we hardcode the filter path
  const filters = columnFilterToQuery(useInitFilters<Planning>({
    path: 'filters.Approvals.current'
  }))

  const { data, mutate, error } = useSWR<AssignmentInterface[] | undefined, Error>(
    isOnline ? key : null, // Disable SWR when offline by setting key to null
    (): Promise<AssignmentInterface[] | undefined> =>
      fetchAssignments({
        index,
        repository,
        session,
        date,
        dateType,
        timeZone,
        requireDeliverable,
        requireMetrics,
        type
      }),
    {
      keepPreviousData: true, // Keep cached data when going offline
      revalidateOnReconnect: true, // Revalidate immediately when coming back online
      revalidateOnFocus: isOnline, // Revalidate immediately when coming back online only when online
      revalidateIfStale: isOnline // Show cached data while revalidating only when online
    }
  )

  if (error) {
    throw new Error('Assignment fetch failed:', { cause: error })
  }

  const filtersWithDefaults = {
    ...filters,
    status: status ? status : filters?.status?.length ? filters.status : defaultStatuses
  }

  const filteredData = filterAssignments(data, filtersWithDefaults)
  const structuredData = structureAssignments(timeZone, filteredData || [], slots)
  const facets = getFacets(data)

  useRepositoryEvents([
    'core/planning-item', 'core/planning-item+meta',
    'core/article', 'core/article+meta',
    'core/editorial-info', 'core/editorial-info+meta',
    'core/flash', 'core/flash+meta'
  ], (event) => {
    // Don't process events when offline
    if (!isOnline) {
      return
    }

    if ((event.event !== 'document'
      && event.event !== 'status'
      && event.event !== 'delete_document'
    )) {
      return
    }

    if (!Array.isArray(data)) {
      return void mutate()
    }

    for (const slot of structuredData) {
      const assignment = slot.items
        .find((assignment) =>
          (assignment._id === event.uuid
            || event.mainDocument === assignment._id
            || assignment._deliverableId === event.uuid
            || assignment._planningId === event.uuid
          ))

      if (assignment) {
        void mutate()
        return
      }
    }

    // Fallback: if the event is a document change, we need to refetch, or we can find new documents
    // temp fix until we have a more fine grained way, aka websocket api.
    // Should rely on swr cache, and not refresh unless the changed document is relevant
    if (event.event === 'document') {
      void mutate()
    }
  })

  return [structuredData, facets]
}
