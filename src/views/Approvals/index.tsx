import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { EarthIcon } from '@ttab/elephant-ui/icons'
import { TimeSlot } from './TimeSlot'
import { ClockIcon } from '@/components/ClockIcon'

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
  const { locale, timeZone } = useRegistry()
  const { data: session } = useSession()


  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Dagen' short='Dagen' iconColor='#5E9F5D' icon={EarthIcon} />
      </ViewHeader.Root>

      <View.Content>
        <div className='flex flex-row h-full overflow-x-scroll snap-x snap-mandatory @7xl/view:grid @7xl/view:grid-cols-5 '>
          {Object.keys(Slots).map((slot) => {
            return (
              <TimeSlot
                key={slot}
                name={slot}
                label={Slots[slot].label}
                slots={Slots[slot].slots}
              >

                <div className='flex flex-col justify-stretch border bg-white rounded p-2 text-sm'>
                  <div className='flex flex-row justify-between'>
                    <div></div>
                    <div className='flex flex-row gap-1 items-center'>
                      <ClockIcon hour={9} size={14} className='opacity-50' />
                      <time>21:34</time>
                    </div>
                  </div>

                  <div>
                    <div className='text-sm font-bold'>
                      Utvecklingssamtal i skolan – då kommer advokaten och ställer till det
                    </div>
                    <div>lärarombud</div>
                  </div>

                  <div className='flex flex-row text-xs'>
                    Inrikes
                  </div>
                </div>
              </TimeSlot>
            )
          })}
        </div>

      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
