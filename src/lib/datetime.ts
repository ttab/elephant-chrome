/**
 * Format a local date/time to ISO format but in the UTC timezone.
 *
 * @param localDate
 * @param locale
 * @returns string
 */
export function convertToISOStringInUTC(localDate: Date, locale: string): string {
  return convertToISOStringInTimeZone(localDate, locale, 'UTC')
}

/**
 * Format a date/time to ISO format but in the local timezone.
 *
 * @param localDate
 * @param locale
 * @param timeZone
 * @returns string
 */
export function convertToISOStringInTimeZone(localDate: Date, locale: string, timeZone: string): string {
  return localDate.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone
  })
}

/**
* Format a iso string to a human readable date and time.
* @param date Date
* @param locale string
* @param timeZone string
* @returns string
* */
export function dateToReadableDateTime(
  date: Date,
  locale: string,
  timeZone: string
): string | undefined {
  const yearFormat = {
    timeZone,
    year: 'numeric' as '2-digit'
  }
  const year = new Intl.DateTimeFormat(locale, yearFormat).format(date)
  const currentYear = new Intl.DateTimeFormat(locale, yearFormat).format(new Date())

  if (year === currentYear) {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    timeStyle: 'short',
    dateStyle: 'medium'
  }).format(date)
}

/**
* Format a iso string to a human readable date.
* @param date Date
* @param locale string
* @param timeZone string
* @returns string
* */
export function dateToReadableTime(
  date: Date,
  locale: string,
  timeZone: string
): string | undefined {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    hour12: is12HourcycleFromLocale(locale)
  }).format(date)
}

/**
 * Return start time and end time of local date. I.e a date with the local date/time
 * "2024-12-28 12:10:43" will return "2024-12-28 00:00:00" and "2024-12-28 23:59:59".
 *
 * @param localDate
 * @returns {Date, Date}
 */
export function getDateTimeBoundaries(localDate: Date): { startTime: Date, endTime: Date } {
  const startTime = new Date(localDate)
  const endTime = new Date(localDate)

  startTime.setHours(0, 0, 0, 0)
  endTime.setHours(23, 59, 59, 999)

  return {
    startTime,
    endTime
  }
}
/**
* Determine if 12h or 24h clock should be used based on the locale.
*
* @param locale
* @returns boolean
*/
export function is12HourcycleFromLocale(locale: string): boolean {
  try {
    const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', hourCycle: 'h12' })
    const sampleDate = new Date(2000, 0, 1, 13, 0, 0) // 1:00 PM

    const formattedDate = formatter.formatToParts(sampleDate)

    return formattedDate.some(part => part.type === 'dayPeriod' &&
      (part.value === 'AM' || part.value === 'PM'))
  } catch (error) {
    console.error('Error getting hour cycle:', error)
    return false
  }
}

/**
* Get current date in UTC timezone.
**/
export function currentDateInUTC(): string {
  const dateString = new Date().toISOString()
  return dateString.split('T')[0]
}
