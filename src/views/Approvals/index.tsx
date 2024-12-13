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

  // We manually setup grid fractions as tw grid-cols-N does not work as we want
  const gridFractions = Array(slots.length).fill('1fr').join(' ')

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Dagen' short='Dagen' iconColor='#5E9F5D' icon={EarthIcon} />
      </ViewHeader.Root>

      <View.Content
        autoScroll={false}
        className='grid h-full w-full overflow-scroll snap-x snap-mandatory'
        style={{ gridTemplateColumns: gridFractions }}
      >
        {data.map((slot) => {
          return (
            <TimeSlot
              key={slot.key}
              name={slot.key || ''}
              label={slot.label || ''}
              slots={slot.hours || []}
            >
              {slot.items.map((assignment) => {
                const time = assignment.data.publish
                  ? format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')
                  : undefined

                return (
                  <div key={assignment.id} tabIndex={0} className='flex flex-col justify-stretch gap-2 border bg-white rounded p-2 text-xs'>
                    <div className='flex flex-row justify-between'>
                      <div>{assignment._newsvalue}</div>
                      <div className='flex flex-row gap-1 items-center'>
                        <ClockIcon hour={(time) ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
                        <time>{time}</time>
                      </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                      <div className='font-bold'>
                        {assignment.title}
                      </div>
                    </div>

                    <div>
                      {assignment.meta.find((m) => m.type === 'tt/slugline')?.value || '-'}
                    </div>

                    <div className='flex flex-row'>
                      {assignment._section}
                      &middot;
                      Anders Andersson/TT
                      &middot;
                      1024 tkn
                    </div>
                  </div>
                )
              })}
            </TimeSlot>
          )
        })}
        {/* </div> */}

      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
