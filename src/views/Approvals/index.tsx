import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { TimeSlot } from './TimeSlot'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useNavigationKeys, useOpenDocuments, useQuery, useRegistry, useRepositorySocket } from '@/hooks'
import { Header } from '@/components/Header'
import { ApprovalsCard } from './ApprovalsCard'
import { Toolbar } from './Toolbar.tsx'
import { StatusSpecifications } from '@/defaults/workflowSpecification'
import { useTrackedDocuments } from '@/hooks/useTrackedDocuments.tsx'
import { Error } from '../Error/index.tsx'
import { ApprovalsSkeleton } from './ApprovalsSkeleton'
import { useInitFilters } from '@/hooks/useInitFilters'
import { columnFilterToQuery } from '@/lib/loadFilters'
import { filterAssignments, getFacets } from './lib/filterAssignments'
import { structureAssignments } from './lib/structureAssignments'
import { preprocessApprovalData } from './preprocessor'
import { getUTCDateRange } from '@/shared/datetime'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import type { Planning } from '@/shared/schemas/planning'
import { createMetricsDecorator, type MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'

const meta: ViewMetadata = {
  name: 'Approvals',
  path: `${import.meta.env.BASE_URL}/approvals`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Approvals = (): JSX.Element => {
  return (
    <ApprovalsView />
  )
}

export const ApprovalsView = (): JSX.Element => {
  const trackedDocuments = useTrackedDocuments()
  const [query] = useQuery()
  const { timeZone, repository } = useRegistry()

  const { from, to } = useMemo(() =>
    getUTCDateRange(query?.from
      ? new Date(query?.from as string)
      : new Date(), timeZone), [query, timeZone])

  const include = useMemo(() => {
    return ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}']
  }, [])

  const decorators = useMemo(() => {
    if (!repository) return []

    return [
      createMetricsDecorator({
        repository,
        kinds: ['charcount']
      })
    ]
  }, [repository])

  const { data, error, isLoading } = useRepositorySocket<MetricsDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include,
    decorators
  })

  const columnFilters = useInitFilters<Planning>({
    path: 'filters.Approvals.current'
  })
  const filters = useMemo(() => columnFilterToQuery(columnFilters), [columnFilters])

  const filtersWithDefaults = useMemo(() => {
    const defaultStatuses = ['draft', 'done', 'approved', 'withheld']
    return {
      ...filters,
      status: filters?.status?.length ? filters.status : defaultStatuses
    }
  }, [filters])

  // Transform socket data to preprocessed approval items
  const approvalItems = useMemo(() =>
    preprocessApprovalData(data || []),
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

  // Skeleton card counts per column while loading
  const cardCounts = [2, 4, 3, 1]

  // Structure data by time slots
  const structuredData = useMemo(() =>
    structureAssignments(timeZone, filteredData || [], slots),
  [timeZone, filteredData, slots]
  )

  const facets = useMemo(() =>
    getFacets(approvalItems),
  [approvalItems]
  )

  const [focusedColumn, setFocusedColumn] = useState<number>()
  const [focusedCard, setFocusedCard] = useState<number>()

  // Focus on the first card in the current timeslot on load
  useEffect(() => {
    if (typeof focusedColumn !== 'undefined' || typeof focusedCard !== 'undefined') {
      return
    }

    // Determine the column for the current timeslot
    const currentSlot = ((currentHour: number) => {
      return slots.find((slot) => slot.hours.includes(currentHour))
    })(new Date().getHours())
    const currentColumnIndex = slots.findIndex((slot) => slot.key === currentSlot?.key)

    // FIXME: Focus is set but focus ring is not visible when clicking link
    // in the main menu navigation sheet.
    if (currentColumnIndex !== -1 && structuredData[currentColumnIndex]?.items.length > 0) {
      // Current column has cards, focus on first card
      setFocusedColumn(currentColumnIndex)
      setFocusedCard(0)
    } else {
      // As fallback, find first column with card and focus on first card
      const firstNonEmptyColumnIndex = structuredData.findIndex((column) => column.items.length > 0)
      if (firstNonEmptyColumnIndex !== -1) {
        setFocusedColumn(firstNonEmptyColumnIndex)
        setFocusedCard(0)
      }
    }
  }, [slots, structuredData, focusedColumn, focusedCard])

  const [currentTab, setCurrentTab] = useState<string>('grid')
  const openEditors = useOpenDocuments({ idOnly: true, name: 'Editor' })
  const openPlannings = useOpenDocuments({ idOnly: true, name: 'Planning' })

  useNavigationKeys({
    stopPropagation: false, // Manually handle when this is needed
    keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    onNavigation: (event) => {
      if (event.key === 'ArrowLeft' && !focusedColumn) {
        // No column focused or already at leftmost column, let view navigation handle this
        return
      }

      if (event.key === 'ArrowRight' && focusedColumn === slots.length - 1) {
        // At rightmost column, let view navigation handle this
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const n = (focusedColumn === undefined)
          ? (event.key === 'ArrowRight' ? 0 : slots.length - 1)
          : (focusedColumn + (event.key === 'ArrowRight' ? 1 : -1) + slots.length) % slots.length
        setFocusedColumn(n)

        if (focusedCard === undefined) {
          setFocusedCard(0)
        } else if (focusedCard > structuredData[n].items.length - 1) {
          setFocusedCard(Math.max(0, structuredData[n].items.length - 1))
        }

        // Don't let view navigation handle this
        event.stopPropagation()
      } else {
        const n = focusedColumn || 0
        const l = structuredData[n].items.length
        const m = (focusedCard === undefined)
          ? (event.key === 'ArrowDown' ? 0 : l - 1)
          : (focusedCard + (event.key === 'ArrowDown' ? 1 : -1) + l) % l

        if (n !== focusedColumn) {
          setFocusedColumn(n)
        }
        setFocusedCard(m)
      }
    }
  })

  if (error) {
    console.error('Error fetching approvals:', error)
    return <Error message='Kunde inte hämta dokument för Dagen' error={error} />
  }

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          <ViewHeader.Title name='Approvals' title='Dagen' />
          <Header type='Approvals' />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <Toolbar facets={facets} />
      <View.Content variant='grid' columns={slots.length}>
        {slots.map((slot, colN) => (
          <View.Column key={slot.key}>
            <TimeSlot label={slot.label} slots={slot.hours} />

            {isLoading
              ? <ApprovalsSkeleton count={cardCounts[colN]} />
              : structuredData[colN]?.items.map((item, cardN) => {
                const isSelected = ((item._deliverable?.id && openEditors.includes(item._deliverable.id)) || openPlannings.includes(item._preprocessed.planningId))

                return (
                  <ApprovalsCard
                    key={item._assignment.id}
                    item={item}
                    status={StatusSpecifications[item._deliverable?.status || 'draft']}
                    isFocused={colN === focusedColumn && cardN === focusedCard}
                    isSelected={isSelected}
                    openEditors={openEditors}
                    trackedDocument={trackedDocuments.documents.find((doc) => doc.id === item._deliverable?.id)}
                  />
                )
              })}
          </View.Column>
        ))}
      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
