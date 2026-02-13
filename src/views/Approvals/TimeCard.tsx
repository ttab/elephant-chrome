import { Popover, PopoverTrigger, Tooltip, PopoverContent } from '@ttab/elephant-ui'
import { ClockIcon } from '@/components/ClockIcon'
import { format, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { dateInTimestampOrShortMonthDayTimestamp, newLocalDate, parseDate } from '@/shared/datetime'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import { useQuery } from '@/hooks/useQuery'
import type { PreprocessedApprovalData } from './preprocessor'
import { useRegistry } from '@/hooks/useRegistry'
import { useMemo } from 'react'
import { timesSlots } from '@/defaults/assignmentTimeslots'
import type { LocaleData } from '@/types/index'
import { getPublishSlot, getPublishTime, getStartTime } from '@/lib/documentHelpers'
import type { DocumentMeta } from '@ttab/elephant-api/repository'

export const TimeCard = ({ item }: { item: PreprocessedApprovalData }) => {
  const [query] = useQuery()
  const { timeZone, locale } = useRegistry()

  const compareDate = useMemo(() => (
    typeof query?.from === 'string'
      ? parseDate(query.from)
      : newLocalDate(DEFAULT_TIMEZONE)
  ), [query?.from])

  const deliverableMeta = item._deliverable?.meta || null

  const time = useMemo(() =>
    getAssignmentTime({ item, timeZone, locale, deliverableMeta, compareDate }),
  [item, timeZone, locale, deliverableMeta, compareDate]
  )

  const timeTooltip = useMemo(() =>
    getTimeTooltip({ item, deliverableMeta, timeZone, locale, compareDate }),
  [item, deliverableMeta, timeZone, locale, compareDate]
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

function getAssignmentTime({ item, timeZone, locale, deliverableMeta, compareDate }: {
  item: PreprocessedApprovalData
  timeZone: string
  locale: LocaleData
  deliverableMeta: DocumentMeta | null
  compareDate?: Date
}): string | undefined {
  const deliverableStatus = item._deliverable?.status
  const publishSlot = getPublishSlot(item._assignment)
  const publish = getPublishTime(item._assignment)
  const start = getStartTime(item._assignment)

  if (
    deliverableStatus === 'draft'
    && !deliverableMeta?.workflowCheckpoint
    && publishSlot
  ) {
    return getTimeslotLabel(parseInt(publishSlot))
  }

  if (publish && deliverableStatus === 'withheld') {
    return format(toZonedTime(parseISO(publish), timeZone), 'HH:mm')
  }

  if (deliverableMeta?.modified) {
    return compareDate
      ? dateInTimestampOrShortMonthDayTimestamp(deliverableMeta.modified, locale.code.full, timeZone, compareDate)
      : format(toZonedTime(parseISO(deliverableMeta.modified), timeZone), 'HH:mm')
  }

  if (start) {
    return format(toZonedTime(parseISO(start), timeZone), 'HH:mm')
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

function getTimeTooltip({ item, deliverableMeta, timeZone, locale, compareDate }: {
  item: PreprocessedApprovalData
  deliverableMeta: DocumentMeta | null
  timeZone: string
  locale: LocaleData
  compareDate?: Date
}): string {
  const deliverableStatus = item._deliverable?.status
  const publish = getPublishTime(item._assignment)

  if (deliverableStatus === 'withheld' && publish) {
    return `Schemalagd kl ${format(toZonedTime(parseISO(publish), timeZone), 'HH:mm')}`
  }
  if (deliverableMeta?.modified) {
    if (compareDate) {
      return `Senast ändrad ${dateInTimestampOrShortMonthDayTimestamp(deliverableMeta.modified, locale.code.full, timeZone, compareDate)}`
    }
    return `Senast ändrad ${format(toZonedTime(parseISO(deliverableMeta.modified), timeZone), 'HH:mm')}`
  }
  return 'Senast ändrad'
}
