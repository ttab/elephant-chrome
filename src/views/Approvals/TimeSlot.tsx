import type { PropsWithChildren } from 'react'

export const TimeSlot = ({ name, label, slots, children }: PropsWithChildren & {
  name: string
  label: string
  slots: number[]
}): JSX.Element => {
  const { startTime, endTime } = getTimeRange(slots)

  return (
    <div className={`
      w-[96vw]
      col-span-1
      flex-grow
      flex-shrink-0
      @lg/view:w-[49vw]
      @3xl/view:w-[33.5vw]
      @5xl/view:w-[24.75vw]
      @7xl/view:w-[auto]
      snap-center
      @lg/view:snap-start
      last:-border-s-0
      -mx-1
      px-2
      first:ps-1
      @lg/view:last:pe-0
      @lg/view:last:me-0
      flex
      flex-col
      `}
    >
      <div className='w-full flex flex-col bg-white p-2'>
        <span className='text-sm'>{label}</span>

        <div className='flex flex-row gap-1 text-xs text-gray-400'>
          {(startTime) && <time dateTime={startTime}>{startTime}</time>}
          {(startTime || endTime) ? <span>-</span> : <span>&nbsp;</span>}
          {(endTime) && <time dateTime={endTime}>{endTime}</time>}
        </div>
      </div>

      <div className='w-full flex-grow bg-muted'>
        <div className='p-1 rounded-sm'>
          {children}
        </div>
      </div>

    </div>
  )
}


/**
 * Format time range into startTime and endTime
 *
 * FIXME: Time format should be locale specific
*/
function getTimeRange(hours: number[]): {
  startTime?: string
  endTime?: string
} {
  if (hours.length === 0) {
    return {}
  }

  // Sort the array to ensure values are in order
  const sortedHours = [...hours].sort((a, b) => a - b)

  const startHour = sortedHours[0]
  const endHour = sortedHours[sortedHours.length - 1]

  const formatHour = (hour: number, minutes: string) => {
    return hour.toString().padStart(2, '0') + ':' + minutes
  }

  return {
    startTime: formatHour(startHour, '00'),
    endTime: formatHour(endHour, '59')
  }
}
