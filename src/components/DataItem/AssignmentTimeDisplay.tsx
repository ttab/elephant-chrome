import { dateToReadableDay, dateToReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import type { LucideProps } from '@ttab/elephant-ui/icons'

type Time = { time: Array<Date | string | undefined>, tooltip: string, type: string } | undefined

export const AssignmentTimeDisplay = ({ date, className, icon }: { date: Time, className?: string, icon: React.FC<LucideProps> }): JSX.Element => {
  const { locale, timeZone } = useRegistry()
  const Icon = icon

  function displayDay(time: Array<Date | string | undefined>): string {
    const timeValue = typeof time[0] === 'object' ? time[0] : typeof time[0] === 'string' ? new Date(time[0]) : ''
    if (!timeValue) {
      return ''
    }

    return dateToReadableDay(timeValue, locale.code.full, timeZone) || ''
  }

  return (
    <div className='flex flex-col text-right'>
      <div className={cn('font-medium text-sm select-none flex gap-1 items-center justify-between w-full', className)}>
        {date?.type && ['picture', 'video'].includes(date.type) && <span>{displayDay(date.time)}</span>}
        {date?.time.map((timestamp, index) => (
          <span key={date.time.join('') + date.tooltip + index}>
            {typeof timestamp === 'object' ? dateToReadableTime(timestamp, locale.code.full, timeZone) : timestamp}
            {index < date.time.length - 1 && <span>{' - '}</span>}
          </span>
        ))}
        <Icon size={18} />
      </div>
      <span className='text-xs'>{date?.tooltip}</span>
    </div>
  )
}
