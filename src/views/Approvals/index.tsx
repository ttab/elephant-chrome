import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { TimeSlot } from './TimeSlot'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useDateRange, useNavigationKeys, useOpenDocuments, useRegistry, useRepositorySocket } from '@/hooks'
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
import { preprocessApprovalData, APPROVALS_SUBSET } from './preprocessor'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import type { Planning } from '@/shared/schemas/planning'
import { createMetricsDecorator, type MetricsDecorator } from '@/hooks/useRepositorySocket/decorators/metrics'
import { SocketStatus } from '@/hooks/useRepositorySocket/lib/components/SocketStatus'
import { useTranslation } from 'react-i18next'

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
  const trackedDocuments = useTrackedDocuments()
  const { t } = useTranslation()
  const { timeZone, repository } = useRegistry()
  const { from, to } = useDateRange()

  const decorators = useMemo(() => {
    if (!repository) return []

    return [
      createMetricsDecorator({
        repository,
        kinds: ['charcount']
      })
    ]
  }, [repository])

  const { data, error, isLoading, status } = useRepositorySocket<MetricsDecorator>({
    type: 'core/planning-item',
    from,
    to,
    include: ['.meta(type=\'core/assignment\').links(rel=\'deliverable\')@{uuid:doc}'],
    subset: [...APPROVALS_SUBSET],
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

  // Track focused assignment by ID rather than by (column, card) indices.
  // Index-based tracking causes focus to jump to a different card when data
  // updates reorder items in a column; ID-based tracking is stable across updates.
  const [focusedId, setFocusedId] = useState<string | undefined>()

  // Focus on the first card in the current timeslot on initial load
  useEffect(() => {
    if (focusedId !== undefined) return

    const currentHour = new Date().getHours()
    const currentSlotIndex = structuredData.findIndex((col) =>
      slots.find((s) => s.key === col.key)?.hours.includes(currentHour)
    )

    if (currentSlotIndex !== -1 && structuredData[currentSlotIndex]?.items.length > 0) {
      setFocusedId(structuredData[currentSlotIndex].items[0].id)
      return
    }

    // Fallback: focus first card in first non-empty column
    const firstNonEmpty = structuredData.find((col) => col.items.length > 0)
    if (firstNonEmpty?.items.length) {
      setFocusedId(firstNonEmpty.items[0].id)
    }
  }, [slots, structuredData, focusedId])

  // When the focused item disappears from data, reset so the initial-focus effect re-runs
  useEffect(() => {
    if (focusedId === undefined) return
    const found = structuredData.some((col) => col.items.some((item) => item.id === focusedId))
    if (!found) {
      setFocusedId(undefined)
    }
  }, [structuredData, focusedId])

  const [currentTab, setCurrentTab] = useState<string>('grid')
  const openEditors = useOpenDocuments({ idOnly: true, name: 'Editor' })
  const openPlannings = useOpenDocuments({ idOnly: true, name: 'Planning' })

  useNavigationKeys({
    stopPropagation: false, // Manually handle when this is needed
    keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    onNavigation: (event) => {
      // Find the current item's position in the structured data grid by ID
      let currentColN = -1
      let currentCardN = -1

      if (focusedId !== undefined) {
        for (let colN = 0; colN < structuredData.length; colN++) {
          const cardN = structuredData[colN].items.findIndex((item) => item.id === focusedId)
          if (cardN !== -1) {
            currentColN = colN
            currentCardN = cardN
            break
          }
        }
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const goRight = event.key === 'ArrowRight'

        // At boundary (or nothing focused on the left): let view navigation handle
        if (!goRight && currentColN <= 0) return
        if (goRight && currentColN === slots.length - 1) return

        const nextColN = currentColN === -1
          ? 0
          : currentColN + (goRight ? 1 : -1)

        const nextCol = structuredData[nextColN]
        if (!nextCol?.items.length) {
          event.stopPropagation()
          return
        }

        const nextCardN = currentCardN === -1 ? 0 : Math.min(currentCardN, nextCol.items.length - 1)
        setFocusedId(nextCol.items[nextCardN].id)
        event.stopPropagation()
        return
      }

      // Up/Down: navigate within the current column
      const colN = currentColN === -1 ? 0 : currentColN
      const col = structuredData[colN]
      if (!col?.items.length) return

      const l = col.items.length
      const nextCardN = currentCardN === -1
        ? (event.key === 'ArrowDown' ? 0 : l - 1)
        : (currentCardN + (event.key === 'ArrowDown' ? 1 : -1) + l) % l

      setFocusedId(col.items[nextCardN].id)
    }
  })

  if (error) {
    console.error('Error fetching approvals:', error)
    return <Error message={t('errors:messages.failedFetchingDocument')} error={error} />
  }

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          <ViewHeader.Title name='Approvals' title={t('views:approvals.title')} />
          <Header type='Approvals' />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <Toolbar facets={facets} />
      <SocketStatus status={status} />
      <View.Content variant='grid' columns={slots.length}>
        {slots.map((slot, colN) => (
          <View.Column key={slot.key}>
            <TimeSlot label={slot.label} slots={slot.hours} />

            {isLoading
              ? <ApprovalsSkeleton count={cardCounts[colN]} />
              : structuredData[colN]?.items.map((item) => {
                const isSelected = ((item._deliverable?.id && openEditors.includes(item._deliverable.id)) || openPlannings.includes(item._preprocessed.planningId))

                return (
                  <ApprovalsCard
                    key={item.id}
                    item={item}
                    status={StatusSpecifications[item._deliverable?.status || 'draft']}
                    isFocused={focusedId === item.id}
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
