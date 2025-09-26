import { Popover, PopoverTrigger, Tooltip, PopoverContent } from '@ttab/elephant-ui'
import { ClockIcon } from '@/components/ClockIcon'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { dateInTimestampOrShortMonthDayTimestamp, newLocalDate, parseDate } from '@/shared/datetime'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import { useQuery } from '@/hooks/useQuery'
import type { AssignmentInterface } from '@/hooks/index/useAssignments'
import type { StatusData } from '@/types'
import { useRegistry } from '@/hooks/useRegistry'
import { useMemo } from 'react'
import { timesSlots } from '@/defaults/assignmentTimeslots'
import type { LocaleData } from '@/types/index'

export const TimeCard = ({ assignment }: { assignment: AssignmentInterface }) => {
  const [query] = useQuery()
  const { timeZone, locale } = useRegistry()

  const compareDate = useMemo(() => (
    typeof query?.from === 'string'
      ? parseDate(query.from)
      : newLocalDate(DEFAULT_TIMEZONE)
  ), [query?.from])

  const statusData: StatusData | null = useMemo(() => (
    assignment?._statusData
      ? JSON.parse(assignment._statusData) as StatusData
      : null
  ), [assignment?._statusData])

  const time = useMemo(() =>
    getAssignmentTime({ assignment, timeZone, locale, statusData, compareDate }),
  [assignment, timeZone, locale, statusData, compareDate]
  )

  const timeTooltip = useMemo(() =>
    getTimeTooltip({ assignment, statusData, timeZone, locale, compareDate }),
  [assignment, statusData, timeZone, locale, compareDate]
  )

  return (
    <Popover>
      <PopoverTrigger onClick={(e) => e.stopPropagation()}>
        <Tooltip content={timeTooltip}>
          <div className='flex flex-row gap-1 items-center'>
            <ClockIcon hour={time ? parseInt(time.slice(0, 2)) : undefined} size={14} className='opacity-50' />
            <time>{time}</time>
          </div>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent>
        {statusData?.modified
          ? `Senast ändrad ${format(toZonedTime(parseISO(statusData.modified), timeZone), 'HH:mm')}`
          : 'Senast ändrad'}
      </PopoverContent>
    </Popover>
  )
}

function getAssignmentTime({ assignment, timeZone, locale, statusData, compareDate }: {
  assignment: AssignmentInterface
  timeZone: string
  locale: LocaleData
  statusData: StatusData | null
  compareDate?: Date
}): string | undefined {
  if (
    assignment._deliverableStatus === 'draft'
    && !statusData?.workflowCheckpoint
    && assignment.data.publish_slot
  ) {
    return getTimeslotLabel(parseInt(assignment.data.publish_slot))
  }

  if (assignment.data.publish && assignment._deliverableStatus === 'withheld') {
    return format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')
  }

  if (statusData?.modified) {
    return compareDate
      ? dateInTimestampOrShortMonthDayTimestamp(statusData.modified, locale.code.full, timeZone, compareDate)
      : format(toZonedTime(parseISO(statusData.modified), timeZone), 'HH:mm')
  }

  if (assignment.data.start) {
    return format(toZonedTime(parseISO(assignment.data.start), timeZone), 'HH:mm')
  }

  return undefined
}

export function getTimeslotLabel(hour: number): string | undefined {
  for (const key in timesSlots) {
    if (timesSlots[key].slots.includes(hour)) {
      return timesSlots[key].label
    }
  }
  return undefined
}

function getTimeTooltip({ assignment, statusData, timeZone, locale, compareDate }: {
  assignment: AssignmentInterface
  statusData: StatusData | null
  timeZone: string
  locale: LocaleData
  compareDate?: Date
}): string {
  if (assignment._deliverableStatus === 'withheld' && assignment.data.publish) {
    return `Schemalagd kl ${format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')}`
  }
  if (statusData?.modified) {
    if (compareDate) {
      return `Senast ändrad ${dateInTimestampOrShortMonthDayTimestamp(statusData.modified, locale.code.full, timeZone, compareDate)}`
    }
    return `Senast ändrad ${format(toZonedTime(parseISO(statusData.modified), timeZone), 'HH:mm')}`
  }
  return 'Senast ändrad'
}
