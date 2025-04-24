import { useRegistry } from '@/hooks/useRegistry'
import { useMemo } from 'react'

export const Time = ({ startTime, endTime }: { startTime?: Date | undefined, endTime?: Date | undefined }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  return useMemo(() => {
    if (!startTime || !endTime) {
      return <></>
    }

    const start = typeof startTime === 'object' ? startTime : new Date(startTime)
    const end = typeof endTime === 'object' ? endTime : new Date(endTime)

    const formattedStartTime = new Intl.DateTimeFormat(locale.code.full, {
      hour: 'numeric',
      minute: 'numeric',
      timeZone
    }).format(start)

    const formattedEndTime = new Intl.DateTimeFormat(locale.code.full, {
      hour: 'numeric',
      minute: 'numeric',
      timeZone
    }).format(end)

    let formattedTime = ''
    const timeDifference = (Math.abs(start.getTime() - end.getTime())) / 3600000

    if (formattedStartTime === formattedEndTime) {
      formattedTime = formattedStartTime
    } else {
      if (timeDifference >= 12) {
        formattedTime = 'Heldag'
      }

      if (timeDifference < 12) {
        formattedTime = `${formattedStartTime} - ${formattedEndTime}`
      }
    }

    return (
      <div className='font-medium text-sm'>{formattedTime}</div>
    )
  }, [locale, timeZone, startTime, endTime])
}
