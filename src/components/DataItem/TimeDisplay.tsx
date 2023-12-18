import { dateToReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'

export const TimeDisplay = ({ date }: { date: Date }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  return (
    <span className='font-medium'>
      {dateToReadableTime(date, locale, timeZone) || '-'}
    </span>
  )
}
