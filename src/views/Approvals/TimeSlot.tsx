import type { PropsWithChildren } from 'react'

export const TimeSlot = ({ label, slots, children }: PropsWithChildren & {
  label: string
  slots: number[]
}): JSX.Element => {
  const { startTime, endTime } = getTimeRange(slots)

  return (
    <>
      <div className='w-full flex flex-col p-2 pb-1'>
        <span className='text-sm'>{label}</span>

        <div className='flex flex-row gap-1 text-xs text-gray-400'>
          {(startTime) && <time dateTime={startTime}>{startTime}</time>}
          {(startTime || endTime) ? <span>-</span> : <span>&nbsp;</span>}
          {(endTime) && <time dateTime={endTime}>{endTime}</time>}
        </div>
      </div>
    </>
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
