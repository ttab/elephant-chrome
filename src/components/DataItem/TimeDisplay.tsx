import { dateToReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'

export const TimeDisplay = ({ date, className }: { date: Date, className?: string }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  return (
    <span className={cn('font-medium text-sm', className)}>
      {dateToReadableTime(date, locale.code.full, timeZone) || '-'}
    </span>
  )
}
