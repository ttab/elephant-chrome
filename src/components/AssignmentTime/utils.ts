import { convertToISOStringInTimeZone } from '@/shared/datetime'
import { DEFAULT_TIMEZONE } from '@/defaults/defaultTimezone'
import type { AssignmentData, AssignmentValueOption } from './types'

export const getTimeSlot = (timeSlot: string, options: AssignmentValueOption[]): AssignmentValueOption | undefined => {
  return options.find((type) => type.slots?.includes(timeSlot))
}

export const getMedianSlot = (slots: AssignmentValueOption[], value: string): string => {
  const slotMedian = slots.find((slot) => slot.value === value)?.median
  return slotMedian || '-1'
}

export const getMidnightISOString = (endDate: string | undefined): string => {
  const endDateString = `${endDate}T00:00:00`
  const endDateIsoString = (new Date(endDateString)).toISOString()
  return endDateIsoString
}

export const makeLocalString = (date: string) => {
  return new Date(date.toString()).toLocaleString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getDateInDefaultTimeZone = (dateTime?: string) => {
  if (!dateTime) {
    return undefined
  }

  const parsedDate = new Date(dateTime)
  if (Number.isNaN(parsedDate.getTime())) {
    return undefined
  }

  return convertToISOStringInTimeZone(parsedDate, DEFAULT_TIMEZONE).slice(0, 10)
}

export const deriveExecutionDates = (
  executionStart: string | undefined,
  executionEnd: string | undefined,
  fallbackData?: AssignmentData
) => {
  const startDateValue = getDateInDefaultTimeZone(executionStart) ?? fallbackData?.start_date
  const endDateValue = getDateInDefaultTimeZone(executionEnd)
    ?? getDateInDefaultTimeZone(executionStart)
    ?? fallbackData?.end_date

  return { startDateValue, endDateValue }
}
