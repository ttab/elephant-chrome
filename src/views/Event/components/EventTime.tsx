import { useState, useEffect } from 'react'
import {
  Calendar,
  type CalendarTypes,
  Button,
  Switch,
  PopoverDrawer
} from '@ttab/elephant-ui'
import { useYValue } from '@/hooks/useYValue'
import { useRegistry } from '@/hooks'
import { dateToReadableDateTime, dateToReadableTime, dateToReadableDay, createDateWithTime } from '@/lib/datetime'
import { TimeInput } from '@/components/TimeInput'
import { TriangleAlert } from '@ttab/elephant-ui/icons'
import type { FormProps } from '@/components/Form/Root'

interface EventData {
  end: string
  start: string
  registration: string
  dateGranularity: 'date' | 'datetime'
}

const isSameDate = (fromDate: string, toDate: string): boolean => {
  const f = new Date(fromDate)
  const t = new Date(toDate)

  return f.getFullYear() === t.getFullYear() && f.getMonth() === t.getMonth() && f.getDate() === t.getDate()
}

const dateTimeLabel = ({
  fromDate,
  toDate,
  locale,
  timeZone
}: {
  fromDate?: string | undefined
  toDate?: string | undefined
  locale: string
  timeZone: string
}): string => {
  if (!fromDate || !toDate) {
    return ''
  }

  const sameDay = isSameDate(fromDate, toDate)
  const sameTime = fromDate === toDate
  const from = dateToReadableDateTime(new Date(fromDate), locale, timeZone)
  const to = sameDay
    ? dateToReadableTime(new Date(toDate), locale, timeZone)
    : dateToReadableDateTime(new Date(toDate), locale, timeZone)

  return sameTime && from ? from : `${from} - ${to}`
}


const dateLabel = ({ fromDate, toDate, locale, timeZone }: { fromDate?: string | undefined, toDate?: string | undefined, locale: string, timeZone: string }): string => {
  if (!fromDate || !toDate) {
    return ''
  }
  const fromDateObject = new Date(fromDate)
  const toDateObject = new Date(toDate)
  const sameDay = isSameDate(fromDate, toDate)
  const from = dateToReadableDay(fromDateObject, locale, timeZone)
  const to = dateToReadableDay(toDateObject, locale, timeZone)
  return `Heldag ${sameDay ? ` ${from}` : ` ${from} - ${to}`}`
}

const testValid = (time: string): boolean => {
  return (/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
}

const dateMidnight = (date: Date): Date => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  )
}

export const EventTimeMenu = ({ onChange }: FormProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [eventData, setEventData] = useYValue<EventData>('meta.core/event[0].data')
  const [selected, setSelected] = useState<CalendarTypes.DateRange | undefined>({ from: dateMidnight(new Date()) })
  const [startTimeValue, setStartTimeValue] = useState<string>('00:00')
  const [endTimeValue, setEndTimeValue] = useState<string>('23:59')
  const [startDateValue, setStartDateValue] = useState<string>()
  const [endDateValue, setEndDateValue] = useState<string>()
  const { locale, timeZone } = useRegistry()
  const [mounted, setMounted] = useState(false)
  const [startTimeValid, setStartTimeValid] = useState(false)
  const [endTimeValid, setEndTimeValid] = useState(false)
  const [fullDay, setFullDay] = useState(false)

  useEffect(() => {
    if (!mounted && eventData) {
      const savedDates: CalendarTypes.DateRange = { from: undefined, to: undefined }
      setFullDay(eventData?.dateGranularity === 'date')

      if (eventData?.start) {
        const aDate = new Date(eventData.start.toString())
        const startValue = aDate.toLocaleString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        })
        setStartTimeValue(startValue)
        setStartDateValue(eventData.start)
        setStartTimeValid(testValid(startValue))

        const startDateObject = new Date(eventData.start)
        const newStartDayWithTime = createDateWithTime(startDateObject, '00:00')
        savedDates.from = newStartDayWithTime
      }

      if (eventData?.end) {
        const aDate = new Date(eventData.end.toString())
        const endValue = aDate.toLocaleString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        })
        setEndTimeValue(endValue)
        setEndDateValue(eventData.end)
        setEndTimeValid(testValid(endValue))

        const endDate = new Date(eventData.end)
        const newEndDayWithTime = createDateWithTime(endDate, '00:00')
        savedDates.to = newEndDayWithTime
      }

      setSelected(savedDates)
      setMounted(true)
    }
  }, [eventData, mounted])

  const handleOnSelect = ({ eventStart, eventEnd, fullDay }: {
    eventStart: string | undefined
    eventEnd: string | undefined
    fullDay: boolean | undefined
  }): void => {
    if (!eventStart || !eventEnd) {
      return
    }
    let startDate = eventStart
    let endDate = eventEnd

    onChange?.(true)
    if (fullDay) {
      const start = new Date(eventStart)
      const startMidnight = dateMidnight(start)
      startDate = startMidnight.toISOString()

      const end = new Date(eventEnd)
      const endDay = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
        23,
        59,
        59,
        999
      )
      endDate = endDay.toISOString()
    }
    const newEventData: EventData = {
      start: startDate,
      end: endDate,
      dateGranularity: fullDay ? 'date' : 'datetime',
      registration: eventData?.registration ? eventData.registration : ''
    }
    setEventData(newEventData)
  }

  const handleStartTimeChange = (time: string): void => {
    const valid = testValid(time)
    setStartTimeValid(valid)
    if (valid && selected?.from) {
      setStartTimeValue(time)
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))
      const newSelectedDate = new Date(selected.from)
      newSelectedDate.setHours(hours, minutes)
      setStartDateValue(newSelectedDate.toISOString())
    }
  }

  const handleEndTimeChange = (time: string): void => {
    const valid = testValid(time)
    setEndTimeValid(valid)

    if (valid && selected?.to) {
      setEndTimeValue(time)
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))
      const newSelectedDate = new Date(selected.to)
      newSelectedDate.setHours(hours, minutes)
      setEndDateValue(newSelectedDate.toISOString())
    }
  }

  const handleOnSelectDay: CalendarTypes.OnSelectHandler<CalendarTypes.DateRange | undefined> = (selectedDays) => {
    setSelected(selectedDays)
    if (selectedDays?.from && !selectedDays.to) {
      const newStartDayWithTime = createDateWithTime(selectedDays.from, startTimeValue)
      const endDateValueWithTime = createDateWithTime(selectedDays.from, endTimeValue)
      setStartDateValue(newStartDayWithTime.toISOString())
      setEndDateValue(endDateValueWithTime.toISOString())
    }

    if (selectedDays?.to && selectedDays.from) {
      const endDayWithTime = createDateWithTime(selectedDays.to, endTimeValue)
      setEndDateValue(endDayWithTime.toISOString())
      const startDayWithTime = createDateWithTime(selectedDays.from, startTimeValue)
      setStartDateValue(startDayWithTime.toISOString())
      setEndTimeValid(testValid(endTimeValue))
    }
  }

  const handleCheckedChange = (checked: boolean): void => {
    setFullDay(checked)
  }

  const handleOnTimeSelect = (): void => {
    if (startTimeValid && endTimeValid) {
      handleOnSelect({
        eventStart: startDateValue,
        eventEnd: endDateValue,
        fullDay
      })
    }
  }

  const triggerLabel = fullDay
    ? dateLabel({
      fromDate: eventData?.start,
      toDate: eventData?.end,
      timeZone,
      locale: locale.code.full
    })
    : dateTimeLabel({
      fromDate: eventData?.start,
      toDate: eventData?.end,
      timeZone,
      locale: locale.code.full
    })

  return (
    <PopoverDrawer triggerLabel={triggerLabel} open={open} setOpen={setOpen} modal={true}>
      <div className='p-2'>
        <Calendar
          mode='range'
          required={false}
          selected={selected}
          weekStartsOn={1}
          onSelect={handleOnSelectDay}
          className='p-2'
        />
        <div className='flex pt-2 pb-2 '>
          <Switch
            id='wholeDaySwitch'
            onCheckedChange={(checked) => handleCheckedChange(checked)}
            checked={fullDay}
            className='self-center'
          />
          <label htmlFor='wholeDaySwitch' className='text-sm self-center p-2'>Heldag</label>
        </div>
        <div className={`${!fullDay && startDateValue && endDateValue && startDateValue > endDateValue ? 'border-2 rounded-md border-red-400 relative' : ''}`}>
          {!fullDay && startDateValue && endDateValue && startDateValue > endDateValue && (
            <div className='absolute -top-1 right-0 h-2 w-2 z-10'>
              <TriangleAlert color='red' fill='#ffffff' size={15} strokeWidth={1.75} />
            </div>
          )}

          <div className='flex justify-between border-2 rounded-md border-slate-100'>
            <div className='px-3 py-2 text-sm'>
              {startDateValue && dateToReadableDay(new Date(startDateValue), locale.code.full, timeZone)}
            </div>
            <div>
              <TimeInput
                defaultTime={startTimeValue}
                handleOnChange={handleStartTimeChange}
                handleOnSelect={handleOnTimeSelect}
                setOpen={setOpen}
                disabled={fullDay}
              />
            </div>
          </div>
          <div className='flex justify-between border-2 rounded-md border-slate-100 mt-2'>
            <div className='px-3 py-2 text-sm'>
              {endDateValue && dateToReadableDay(new Date(endDateValue), locale.code.full, timeZone)}
            </div>
            <div>
              <TimeInput
                defaultTime={endTimeValue}
                handleOnChange={handleEndTimeChange}
                handleOnSelect={handleOnTimeSelect}
                setOpen={setOpen}
                disabled={fullDay}
              />
            </div>
          </div>
        </div>

        <div className='flex items-center justify-end gap-4 pt-2'>
          <Button
            variant='ghost'
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()
              setOpen(false)
            }}
          >
            Avbryt
          </Button>
          <Button
            variant='outline'
            disabled={!fullDay && (startDateValue && endDateValue ? startDateValue > endDateValue : false)}
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()

              handleOnSelect({
                eventStart: startDateValue,
                eventEnd: endDateValue,
                fullDay
              })
              setOpen(false)
            }}
          >
            Klar
          </Button>
        </div>
      </div>
    </PopoverDrawer>
  )
}
