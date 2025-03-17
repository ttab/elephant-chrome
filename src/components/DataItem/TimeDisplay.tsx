import { dateToReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'

export const TimeDisplay = ({ date, className }: { date: Date, className?: string }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  return (
    <span className={`font-medium text-sm ${className || ''}`}>
      {dateToReadableTime(date, locale, timeZone) || '-'}
    </span>
  )
}
