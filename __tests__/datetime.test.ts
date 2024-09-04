import {
  convertToISOStringInUTC,
  convertToISOStringInTimeZone,
  dateToReadableDateTime,
  dateToReadableTime,
  getDateTimeBoundaries,
  is12HourcycleFromLocale,
  currentDateInUTC
} from '@/lib/datetime'

describe('datetime', () => {
  it('convertToISOStringInUTC', () => {
    const date = new Date('2024-09-03T00:00:00')
    const result = convertToISOStringInUTC(date)
    expect(result).toBe('2024-09-03T00:00:00.000Z')
  })

  it('convertToISOStringInTimeZone', () => {
    const date = new Date('2024-09-03T00:00:00')
    expect(convertToISOStringInTimeZone(date, 'Asia/Kolkata'))
      .toBe('2024-09-03T05:30:00.000+05:30')
    expect(convertToISOStringInTimeZone(date, 'Europe/Stockholm'))
      .toBe('2024-09-03T02:00:00.000+02:00')
    expect(convertToISOStringInTimeZone(date, 'America/New_York'))
      .toBe('2024-09-02T20:00:00.000-04:00')
    expect(convertToISOStringInTimeZone(date, 'Australia/Sydney'))
      .toBe('2024-09-03T10:00:00.000+10:00')
  })

  it('dateToReadableDateTime', () => {
    const date = new Date('2024-09-04T10:06:00')
    expect(dateToReadableDateTime(date, 'en-US', 'UTC'))
      .toBe('Sep 4, 10:06 AM')
    expect(dateToReadableDateTime(date, 'sv-SE', 'Europe/Stockholm'))
      .toBe('4 sep. 12:06')
    expect(dateToReadableDateTime(date, 'en-AU', 'Australia/Sydney'))
      .toBe('4 Sept, 08:06 pm')
    expect(dateToReadableDateTime(date, 'en-US', 'Asia/Kolkata'))
      .toBe('Sep 4, 03:36 PM')
  })

  it('dateToReadableTime', () => {
    const date = new Date('2024-09-04T15:06:00')

    expect(dateToReadableTime(date, 'en-US', 'UTC'))
      .toBe('03:06 PM')
    expect(dateToReadableTime(date, 'sv-SE', 'Europe/Stockholm'))
      .toBe('17:06')
    expect(dateToReadableTime(date, 'en-AU', 'Australia/Sydney'))
      .toBe('01:06 am')
    expect(dateToReadableTime(date, 'en-GB', 'Europe/London'))
      .toBe('04:06 pm')
  })

  it('getDateTimeBoundaries', () => {
    const date = new Date('2022-01-01T12:00:00')
    const { startTime, endTime } = getDateTimeBoundaries(date)
    expect(startTime.toISOString()).toBe('2022-01-01T00:00:00.000Z')
    expect(endTime.toISOString()).toBe('2022-01-01T23:59:59.999Z')
  })

  it('is12HourcycleFromLocale', () => {
    const result = is12HourcycleFromLocale('en-US')
    expect(result).toBe(true)
  })

  it('currentDateInUTC', () => {
    const result = currentDateInUTC()
    expect(result).toBeDefined()
  })
})
