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
import { useTranslation } from 'react-i18next'

export const TimeCard = ({ assignment }: { assignment: AssignmentInterface }) => {
  const [query] = useQuery()
  const { timeZone, locale } = useRegistry()
  const { t } = useTranslation()
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
    getAssignmentTime({ assignment, timeZone, locale, statusData, compareDate, t }),
  [assignment, timeZone, locale, statusData, compareDate, t]
  )

  const timeTooltip = useMemo(() =>
    getTimeTooltip({ assignment, statusData, timeZone, locale, compareDate, t }),
  [assignment, statusData, timeZone, locale, compareDate, t]
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
      <PopoverContent className='lg:hidden'>
        {timeTooltip}
      </PopoverContent>
    </Popover>
  )
}

function getAssignmentTime({ assignment, timeZone, locale, statusData, compareDate, t }: {
  assignment: AssignmentInterface
  timeZone: string
  locale: LocaleData
  statusData: StatusData | null
  compareDate?: Date
  t: (key: string) => string
}): string | undefined {
  if (
    assignment._deliverableStatus === 'draft'
    && !statusData?.workflowCheckpoint
    && assignment.data.publish_slot
  ) {
    return getTimeslotLabel(parseInt(assignment.data.publish_slot), t)
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

export function getTimeslotLabel(hour: number, t: (key: string) => string): string | undefined {
  const showTranslatedText = (slot: string) => {
    switch (slot) {
      case 'morning':
        return t('core.timeSlots.morning')
      case 'forenoon':
        return t('core.timeSlots.forenoon')
      case 'afternoon':
        return t('core.timeSlots.afternoon')
      case 'evening':
        return t('core.timeSlots.evening')
      default:
        return 'Translation missing'
    }
  }
  for (const key in timesSlots) {
    if (timesSlots[key].slots.includes(hour)) {
      return showTranslatedText(timesSlots[key].label)
    }
  }
  return undefined
}

function getTimeTooltip({ assignment, statusData, timeZone, locale, compareDate, t }: {
  assignment: AssignmentInterface
  statusData: StatusData | null
  timeZone: string
  locale: LocaleData
  compareDate?: Date
  t: (key: string) => string
}): string {
  if (assignment._deliverableStatus === 'withheld' && assignment.data.publish) {
    return `${t('views.approvals.tooltips.scheduledAt')} ${format(toZonedTime(parseISO(assignment.data.publish), timeZone), 'HH:mm')}`
  }
  if (statusData?.modified) {
    if (compareDate) {
      return `${t('views.approvals.tooltips.lastChanged')} ${dateInTimestampOrShortMonthDayTimestamp(statusData.modified, locale.code.full, timeZone, compareDate)}`
    }
    return `${t('views.approvals.tooltips.lastChanged')} ${format(toZonedTime(parseISO(statusData.modified), timeZone), 'HH:mm')}`
  }
  return t('views.approvals.tooltips.lastChanged')
}
