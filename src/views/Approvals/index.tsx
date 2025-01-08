import { View, ViewHeader } from '@/components'
import type { DefaultValueOption } from '@/types'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { EarthIcon } from '@ttab/elephant-ui/icons'
import { TimeSlot } from './TimeSlot'
import { ClockIcon } from '@/components/ClockIcon'
import { useAssignments } from '@/hooks/index/useAssignments'
import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Card } from '@/components/Card'
import { useEffect, useMemo, useState } from 'react'
import {
  useLink,
  useQuery,
  useRegistry,
  useNavigationKeys,
  useOpenDocuments
} from '@/hooks'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { Header } from '@/components/Header'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'

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
  const { timeZone } = useRegistry()
  const openPlanning = useLink('Planning')
  const openArticle = useLink('Editor')

  const slots = Object.keys(Slots).map((key) => {
    return {
      key,
      label: Slots[key].label,
      hours: Slots[key].slots
    }
  })

  // Prepare lookup table for status icons
  const statusLookup = DocumentStatuses.reduce((acc, item) => {
    acc[item.value] = item
    return acc
  }, {} as Record<string, DefaultValueOption>)

  const [query] = useQuery()

  const { from } = useMemo(() =>
    getDateTimeBoundariesUTC(typeof query.from === 'string'
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date())
    , [query.from])

  const { data = [] } = useAssignments({
    type: 'text',
    date: from ? new Date(from) : new Date(),
    slots,
    statuses: ['draft', 'done', 'approved', 'withheld']
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
    capture: true, // Use capture phase to grab this event before view navigation
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
        <ViewHeader.Title title='Dagen' short='Dagen' iconColor='#5E9F5D' icon={EarthIcon} />
        <ViewHeader.Content>
          <Header tab={currentTab} type='Approvals' />
        </ViewHeader.Content>
      </ViewHeader.Root>

      <View.Content variant='grid' columns={slots.length}>
        {data.map((slot, colN) => {
          return (
            <View.Column key={slot.key}>
              <TimeSlot label={slot.label || ''} slots={slot.hours || []} />

              {slot.items.map((assignment, cardN) => {
                const articleId = assignment.links.find((l) => l.type === 'core/article')?.uuid
                const time = assignment.data.publish
                  ? format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')
                  : undefined

                const isSelected = ((articleId && openEditors.includes(articleId)) || openPlannings.includes(assignment._id))
                const status = statusLookup?.[assignment._deliverableStatus || 'draft']
                const assignees = assignment.links.filter((m) => m.type === 'core/author' && m.title).map((l) => l.title)

                return (
                  <Card.Root
                    key={assignment.id}
                    status={assignment._deliverableStatus || 'draft'}
                    isFocused={colN === focusedColumn && cardN === focusedCard}
                    isSelected={isSelected}
                    onSelect={(event) => {
                      if (event instanceof KeyboardEvent && event.key == ' ') {
                        openPlanning(event, { id: assignment._id })
                      } else if (articleId) {
                        openArticle(event, { id: articleId })
                      }
                    }}
                  >
                    <Card.Header>
                      <div className='flex flex-row gap-2'>
                        {status.icon && <status.icon {...status.iconProps} size={15} />}
                        <span className='bg-secondary inline-block px-1 rounded'>{assignment._newsvalue}</span>
                      </div>

                      <div className='flex flex-row gap-1 items-center'>
                        <ClockIcon hour={(time) ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
                        <time>{time}</time>
                      </div>
                    </Card.Header>

                    <Card.Content>
                      <Card.Title>
                        <div className='truncate'>{assignment._deliverableDocument?.title || assignment.title}</div>
                        <div className='text-xs font-normal opacity-60'>
                          {assignment.meta.find((m) => m.type === 'tt/slugline')?.value || ' '}
                        </div>
                      </Card.Title>
                      <Card.Body className='truncate'>
                        {!assignees.length && '-'}
                        {assignees.length === 1 && assignees[0]}
                        {assignees.length > 2 && `${assignees.join(', ')}`}
                      </Card.Body>
                    </Card.Content>

                    <Card.Footer className='opacity-60'>
                      {assignment._section}
                      &middot;
                      1024 tkn
                    </Card.Footer>

                  </Card.Root>
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
