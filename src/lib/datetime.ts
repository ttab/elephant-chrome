/**
 * Format a local date/time to ISO format but in the UTC timezone.
 *
 * @param localDate
 * @param locale
 * @returns string
 */
export function convertToISOStringInUTC(localDate: Date): string {
  return convertToISOStringInTimeZone(localDate, 'UTC')
}

/**
 * Format a date/time to ISO format but in the local timezone.
 *
 * @param localDate
 * @param timeZone
 * @returns string
 */
export function convertToISOStringInTimeZone(date: Date, timeZone: string): string {
  const getOffset = (date: Date, formatter: Intl.DateTimeFormat): string => {
    const dateStringWithOffset = formatter.format(date)
    const offset = dateStringWithOffset.slice(-8, -3)

    if (offset === '24:00') {
      return 'Z'
    }

    if (parseInt(offset, 10) > 12) {
      const correctedOffset = (24 - parseInt(offset, 10))
        .toString()
        .padStart(2, '0')

      return `-${correctedOffset}:${offset.slice(-2)}`
    }

    return `+${offset}`
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  })

  const parts = formatter.formatToParts(date)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateParts = parts.reduce<any>((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  // Check if hour is '24' and reset to '00'
  if (dateParts.hour === '24') {
    dateParts.hour = '00'
  }

  const formattedDateTime = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}.000${getOffset(date, formatter)}`
  return formattedDateTime
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
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    }).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    timeStyle: 'short',
    dateStyle: 'medium',
    hour12: is12HourcycleFromLocale(locale)
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
  console.log(locale, is12HourcycleFromLocale(locale))
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
      (part.value.toLowerCase() === 'am' || part.value.toLowerCase() === 'pm'))
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
