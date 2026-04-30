import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { TimeSlot } from './TimeSlot'
import { useAssignments } from '@/hooks/index/useAssignments'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useQuery, useNavigationKeys, useOpenDocuments, useRegistry } from '@/hooks'
import { Header } from '@/components/Header'
import { newLocalDate } from '@/shared/datetime.ts'
import { ApprovalsCard } from './ApprovalsCard'
import { Toolbar } from './Toolbar.tsx'
import { getStatusSpecifications } from '@/defaults/workflowSpecification'
import { useTrackedDocuments } from '@/hooks/useTrackedDocuments.tsx'
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
  return (
    <ApprovalsView />
  )
}

export const ApprovalsView = (): JSX.Element => {
  const trackedDocuments = useTrackedDocuments()
  const { t } = useTranslation()
  const { timeZone } = useRegistry()

  const slots = Object.keys(Slots).map((key) => {
    return {
      key,
      label: Slots[key].label,
      hours: Slots[key].slots
    }
  })
  const [query] = useQuery()

  const date = useMemo(() => {
    return (typeof query.from === 'string')
      ? newLocalDate(timeZone, { date: query.from })
      : newLocalDate(timeZone)
  }, [query.from, timeZone])

  const [data, facets] = useAssignments({
    type: ['flash', 'text', 'editorial-info'],
    requireDeliverable: true,
    requireMetrics: ['charcount'],
    date,
    dateType: 'combined-date',
    slots
  })

  // Track focused assignment by ID rather than by (column, card) indices.
  // Index-based tracking causes focus to jump to a different card when data
  // updates reorder items in a column; ID-based tracking is stable across updates.
  const [focusedId, setFocusedId] = useState<string | undefined>()

  // Focus on the first card in the current timeslot on initial load
  useEffect(() => {
    if (focusedId !== undefined) return

    const currentHour = new Date().getHours()
    const currentSlot = slots.find((slot) => slot.hours.includes(currentHour))
    const currentColumn = data.find((col) => col.key === currentSlot?.key)

    if (currentColumn?.items.length) {
      setFocusedId(currentColumn.items[0].id)
      return
    }

    // Fallback: focus first card in first non-empty column
    const firstNonEmpty = data.find((col) => col.items.length > 0)
    if (firstNonEmpty?.items.length) {
      setFocusedId(firstNonEmpty.items[0].id)
    }
  }, [slots, data, focusedId])

  // When the focused item disappears from data, reset so the initial-focus effect re-runs
  useEffect(() => {
    if (focusedId === undefined) return
    const found = data.some((col) => col.items.some((item) => item.id === focusedId))
    if (!found) {
      setFocusedId(undefined)
    }
  }, [data, focusedId])

  const [currentTab, setCurrentTab] = useState<string>('grid')
  const openEditors = useOpenDocuments({ idOnly: true, name: 'Editor' })
  const openPlannings = useOpenDocuments({ idOnly: true, name: 'Planning' })

  useNavigationKeys({
    stopPropagation: false, // Manually handle when this is needed
    keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    onNavigation: (event) => {
      // Find the current item's position in the data grid by ID
      let currentColN = -1
      let currentCardN = -1

      if (focusedId !== undefined) {
        for (let colN = 0; colN < data.length; colN++) {
          const cardN = data[colN].items.findIndex((item) => item.id === focusedId)
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

        const nextCol = data[nextColN]
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
      const col = data[colN]
      if (!col?.items.length) return

      const l = col.items.length
      const nextCardN = currentCardN === -1
        ? (event.key === 'ArrowDown' ? 0 : l - 1)
        : (currentCardN + (event.key === 'ArrowDown' ? 1 : -1) + l) % l

      setFocusedId(col.items[nextCardN].id)
    }
  })

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
      <View.Content variant='grid' columns={slots.length}>
        {data.map((slot) => {
          return (
            <View.Column key={slot.key}>
              <TimeSlot label={slot.label || ''} slots={slot.hours || []} />

              {slot.items.map((assignment) => {
                const isSelected = ((assignment._deliverableId && openEditors.includes(assignment._deliverableId)) || openPlannings.includes(assignment._id))

                return (
                  <ApprovalsCard
                    key={assignment.id}
                    assignment={assignment}
                    status={getStatusSpecifications(assignment._deliverableStatus || 'draft')}
                    isFocused={focusedId === assignment.id}
                    isSelected={isSelected}
                    openEditors={openEditors}
                    trackedDocument={trackedDocuments.documents.find((doc) => doc.id === assignment._deliverableId)}
                  />
                )
              })}
            </View.Column>
          )
        })}

      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
