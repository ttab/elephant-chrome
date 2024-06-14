import { Tooltip } from '@ttab/elephant-ui'
import { CirclePlus, CalendarCheck } from '@ttab/elephant-ui/icons'
import { useMemo } from 'react'

export const PlanningStatus = ({ status }: { status: boolean }): JSX.Element => {
  return useMemo(() => (
    <div className='flex items-center'>
      <Tooltip content={status ? 'Har planerats' : 'Skapa planering'}>
        {status ? <CalendarCheck color='#FF971E' size={18} strokeWidth={1.75} /> : <CirclePlus color='#fff' fill='#5D709F' size={18} strokeWidth={1.75} />}
      </Tooltip>
    </div>
  ), [status])
}
