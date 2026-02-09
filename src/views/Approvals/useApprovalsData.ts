import { useMemo } from 'react'
import { useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { useInitFilters } from '@/hooks/useInitFilters'
import { columnFilterToQuery } from '@/lib/loadFilters'
import { filterAssignments, getFacets, type Facets } from '@/hooks/index/lib/assignments/filterAssignments'
import { structureAssignments, type AssignmentResponseInterface } from '@/hooks/index/lib/assignments/structureAssignments'
import { extractApprovalItems } from './types'
import { getUTCDateRange } from '@/shared/datetime'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import type { Planning } from '@/shared/schemas/planning'
import { createMetricsDecorator, type MetricsData } from '@/hooks/useRepositorySocket/decorators/metrics'

export interface UseApprovalsDataResult {
  structuredData: AssignmentResponseInterface[]
  facets: Facets
  isLoading: boolean
  error: Error | null
  slots: Array<{
    key: string
    label: string
    hours: number[]
  }>
}

/**
 * Custom hook that encapsulates all data fetching, transformation,
 * filtering, and structuring logic for the Approvals view.
 *
 * Fetches planning items with deliverables and enriches them with metrics data
 * (character count, word count, etc.) via the metrics decorator.
 *
 * Separates data concerns from rendering logic. And will eventually be obsolete
 * when we use the new tanstack/react-table list/grid view that are in development.
 */
export function useApprovalsData(): UseApprovalsDataResult {
  const [query] = useQuery()
  const { timeZone, repository } = useRegistry()

  // Get date range for data fetch
  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from
      ? new Date(query?.from as string)
      : new Date(), timeZone), [query, timeZone])

  // Define include pattern for deliverables
  const include = useMemo(() => {
    return ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}']
  }, [])

  // Configure metrics decorator
  const decorators = useMemo(() => {
    if (!repository) return []

    return [
      createMetricsDecorator({
        repository,
        kinds: ['charcount']
      })
    ]
  }, [repository])

  // Fetch planning documents with deliverables and metrics
  const { data, error, isLoading } = useRepositorySocket<MetricsData>({
    type: 'core/planning-item',
    from,
    to,
    include,
    decorators
  })

  // Get filters from user preferences
  const filters = columnFilterToQuery(useInitFilters<Planning>({
    path: 'filters.Approvals.current'
  }))

  // Apply default statuses if none set
  const filtersWithDefaults = useMemo(() => {
    const defaultStatuses = ['draft', 'done', 'approved', 'withheld']
    return {
      ...filters,
      status: filters?.status?.length ? filters.status : defaultStatuses
    }
  }, [filters])

  // Transform socket data to approval items
  const approvalItems = useMemo(() =>
    extractApprovalItems(data || []),
  [data]
  )

  // Apply filters
  const filteredData = useMemo(() =>
    filterAssignments(approvalItems, filtersWithDefaults),
  [approvalItems, filtersWithDefaults]
  )

  // Prepare time slots configuration
  const slots = useMemo(() =>
    Object.keys(Slots).map((key) => ({
      key,
      label: Slots[key].label,
      hours: Slots[key].slots
    })), []
  )

  // Structure data by time slots
  const structuredData = useMemo(() =>
    structureAssignments(timeZone, filteredData || [], slots),
  [timeZone, filteredData, slots]
  )

  // Generate facets for filters
  const facets = useMemo(() =>
    getFacets(approvalItems),
  [approvalItems]
  )

  return {
    structuredData,
    facets,
    isLoading,
    error,
    slots
  }
}
