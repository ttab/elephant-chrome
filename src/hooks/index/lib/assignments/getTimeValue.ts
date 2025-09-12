import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import { parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function getTimeValue(dateStr: string) {
  const d = toZonedTime(parseISO(dateStr), DEFAULT_TIMEZONE)
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
}
