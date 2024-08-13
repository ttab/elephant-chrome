import { useRegistry } from '@/hooks/useRegistry'
import { useMemo } from 'react'

export const Time = ({ startTime, endTime }: { startTime?: Date | undefined, endTime?: Date | undefined }): JSX.Element => {
  const { locale, timeZone } = useRegistry()
  return useMemo(() => {
    if (!startTime || !endTime) {
      return <></>
    }
    const formattedStartTime = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      timeZone
    }).format(startTime)

    const formattedEndTime = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      timeZone
    }).format(endTime)

    let formattedTime = ''
    const timeDifference = (Math.abs(startTime.getTime() - endTime.getTime())) / 3600000

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
