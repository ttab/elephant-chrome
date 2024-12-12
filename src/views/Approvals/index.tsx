import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { EarthIcon } from '@ttab/elephant-ui/icons'
import { TimeSlot } from './TimeSlot'
import { ClockIcon } from '@/components/ClockIcon'
import { useAssignments } from '@/hooks/index/useAssignments'

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

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Dagen' short='Dagen' iconColor='#5E9F5D' icon={EarthIcon} />
      </ViewHeader.Root>

      <View.Content>
        <div className='flex flex-row h-full overflow-x-scroll snap-x snap-mandatory @7xl/view:grid @7xl/view:grid-cols-5 '>
          {data.map((slot) => {
            return (
              <TimeSlot
                key={slot.key}
                name={slot.key || ''}
                label={slot.label || ''}
                slots={slot.hours || []}
              >
                {slot.items.map((assignment) => {
                  return (
                    <div key={assignment.id} className='flex flex-col justify-stretch gap-2 border bg-white rounded p-2 text-xs'>
                      <div className='flex flex-row justify-between'>
                        <div>{assignment._newsvalue}</div>
                        <div className='flex flex-row gap-1 items-center'>
                          <ClockIcon hour={9} size={14} className='opacity-50' />
                          <time>21:34</time>
                        </div>
                      </div>

                      <div className='flex flex-col gap-1'>
                        <div className='font-bold'>
                          {assignment.title}
                        </div>
                        <div>lärarombud</div>
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
        </div>

      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
