import { parseISO } from 'date-fns'

export function getTimeValue(dateStr: string) {
  const d = parseISO(dateStr)
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()
}
