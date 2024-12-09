import { View, ViewHeader } from '@/components'
import { type ViewMetadata } from '@/types'
import { timesSlots as Slots } from '@/defaults/assignmentTimeslots'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { EarthIcon } from '@ttab/elephant-ui/icons'
import { TimeSlot } from './TimeSlot'

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
        <div className='flex flex-row h-screen overflow-x-scroll snap-x snap-mandatory'>
          {Object.keys(Slots).map((slot) => {
            return (
              <TimeSlot
                key={slot}
                name={slot}
                label={Slots[slot].label}
                slots={Slots[slot].slots}
              />
            )
          })}
        </div>

      </View.Content>
    </View.Root>
  )
}

Approvals.meta = meta
