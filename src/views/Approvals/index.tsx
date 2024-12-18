import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { EarthIcon } from '@ttab/elephant-ui/icons'
import { TimeSlot } from './TimeSlot'
import { ClockIcon } from '@/components/ClockIcon'
import { useAssignments } from '@/hooks/index/useAssignments'
import { parseISO, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { useRegistry } from '@/hooks/useRegistry'
import { Card } from '@/components/Card'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { useState } from 'react'
import { useLink } from '@/hooks/useLink'
import { useOpenDocuments } from '@/hooks/useOpenDocuments'

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

  const { data = [] } = useAssignments({
    type: 'text',
    date: new Date(),
    slots
  })

  const [focusedColumn, setFocusedColumn] = useState<number>()
  const [focusedCard, setFocusedCard] = useState<number>()
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
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Dagen' short='Dagen' iconColor='#5E9F5D' icon={EarthIcon} />
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
                return (
                  <Card.Root
                    key={assignment.id}
                    className={(!articleId) ? 'opacity-50' : 'hover:bg-muted'}
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
                      <div>{assignment._newsvalue}</div>
                      <div className='flex flex-row gap-1 items-center'>
                        <ClockIcon hour={(time) ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
                        <time>{time}</time>
                      </div>
                    </Card.Header>

                    <Card.Content>
                      <Card.Title>{assignment.title}</Card.Title>
                      <Card.Body>{assignment.meta.find((m) => m.type === 'tt/slugline')?.value || '-'}</Card.Body>
                    </Card.Content>

                    <Card.Footer>
                      {assignment._section}
                      &middot;
                      Anders Andersson/TT
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
