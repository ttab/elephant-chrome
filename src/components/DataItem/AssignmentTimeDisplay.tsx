import { dateToReadableTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import type { LucideProps } from '@ttab/elephant-ui/icons'

type Time = { time: Date[], tooltip: string }

export const AssignmentTimeDisplay = ({ date, className, icon }: { date: Time, className?: string, icon: React.FC<LucideProps> }): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  const Icon = icon

  return (
    <div className='flex flex-col text-right'>
      <div className={cn('font-medium text-sm select-none flex gap-1 items-center justify-between w-full', className)}>
        {date.time.map((timestamp, index) => (
          <span key={date.time.join('') + date.tooltip + index}>
            {dateToReadableTime(timestamp, locale.code.full, timeZone)}
            {index < date.time.length - 1 && <span>{' - '}</span>}
          </span>
        ))}
        <Icon size={18} />
      </div>
      <span className='text-xs'>{date.tooltip}</span>
    </div>
  )
}
