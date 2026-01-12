import { Tooltip } from '@ttab/elephant-ui'
import { CirclePlusIcon, CalendarCheckIcon } from '@ttab/elephant-ui/icons'
import { useMemo, type JSX } from 'react'

export const Status = ({ status }: { status: string }): JSX.Element => {
  return useMemo(() => (
    <div className='flex items-center'>
      <Tooltip content={status ? 'Har planerats' : 'Skapa planering'}>
        {status
          ? <CalendarCheckIcon color='#FF971E' size={18} strokeWidth={1.75} />
          : <CirclePlusIcon color='#6B6F76' size={18} strokeWidth={1.75} />}
      </Tooltip>
    </div>
  ), [status])
}
