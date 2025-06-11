import { AwarenessDocument, View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { TimeSlot } from './TimeSlot'
import { useAssignments } from '@/hooks/index/useAssignments'
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useNavigationKeys, useOpenDocuments, useRegistry } from '@/hooks'
import { Header } from '@/components/Header'
import { newLocalDate } from '@/lib/datetime'
import { ApprovalsCard } from './ApprovalsCard'
import { Toolbar } from './Toolbar.tsx'
import { StatusSpecifications } from '@/defaults/workflowSpecification'

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
    <AwarenessDocument documentId='document-tracker'>
      <ApprovalsView />
    </AwarenessDocument>
  )
}

export const ApprovalsView = (): JSX.Element => {
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
    if (currentColumnIndex !== -1 && data[currentColumnIndex]?.items.length > 0) {
      // Current column has cards, focus on first card
      setFocusedColumn(currentColumnIndex)
      setFocusedCard(0)
    } else {
      // As fallback, find first column with card and focus on first card
      const firstNonEmptyColumnIndex = data.findIndex((column) => column.items.length > 0)
      if (firstNonEmptyColumnIndex !== -1) {
        setFocusedColumn(firstNonEmptyColumnIndex)
        setFocusedCard(0)
      }
    }
  }, [slots, data, focusedColumn, focusedCard])

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
        } else if (focusedCard > data[n].items.length - 1) {
          setFocusedCard(Math.max(0, data[n].items.length - 1))
        }

        // Don't let view navigation handle this
        event.stopPropagation()
      } else {
        const n = focusedColumn || 0
        const l = data[n].items.length
        const m = (focusedCard === undefined)
          ? (event.key === 'ArrowDown' ? 0 : l - 1)
          : (focusedCard + (event.key === 'ArrowDown' ? 1 : -1) + l) % l

        if (m !== focusedColumn) {
          setFocusedColumn(n)
        }
        setFocusedCard(m)
      }
    }
  })

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <ViewHeader.Root>
        <ViewHeader.Title name='Approvals' title='Dagen' />
        <ViewHeader.Content>
          <Header type='Approvals' />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <Toolbar facets={facets} />
      <View.Content variant='grid' columns={slots.length}>
        {data.map((slot, colN) => {
          return (
            <View.Column key={slot.key}>
              <TimeSlot label={slot.label || ''} slots={slot.hours || []} />

              {slot.items.map((assignment, cardN) => {
                return (
                  <ApprovalsCard
                    key={assignment.id}
                    assignment={assignment}
                    status={StatusSpecifications[assignment._deliverableStatus || 'draft']}
                    isFocused={colN === focusedColumn && cardN === focusedCard}
                    isSelected={((assignment._deliverableId && openEditors.includes(assignment._deliverableId)) || openPlannings.includes(assignment._id))}
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
