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
* Format a iso string to a human readable date.
* @param isoString string
* @param locale string
* @param timeZone string
* @returns string
* */
export function isoStringToHumanReadableTime(
  isoString: string | undefined,
  locale: string = 'en-US',
  timeZone: string = 'America/New York'
): string | undefined {
  if (!isoString) {
    return
  }

  const date = new Date(isoString)

  if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
    return
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone
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
