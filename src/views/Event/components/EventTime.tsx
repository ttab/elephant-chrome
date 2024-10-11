import React, { useState, useRef, useEffect, type ChangeEventHandler } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Input,
  type CalendarTypes,
  Button,
  Switch
} from '@ttab/elephant-ui'
// import { timePickTypes } from './constants'
import { useYValue } from '@/hooks/useYValue'
import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { dateToReadableDateTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'
import { CalendarClockIcon } from '@ttab/elephant-ui/icons'

interface EventData {
  end: string,
  start: string,
  registration: string,
  dateGranularity: 'date' | 'datetime'
}

interface EventTimeItemsProps extends React.PropsWithChildren {
  // handleOnSelect?: ({ excecutionStart, executionEnd }: { excecutionStart: string | undefined, executionEnd: string | undefined }) => void
  className?: string
  index?: number
  startDate?: string
}

const fortmatIsoStringToLocalTime = (isoString: string): JSX.Element => {
  const date = new Date(isoString)
  return <TimeDisplay date={date} />
}

const DateLabel = ({ fromDate, toDate }: { fromDate?: string | undefined, toDate?: string | undefined }): JSX.Element => {
  const from = fromDate ? fortmatIsoStringToLocalTime(fromDate) : null
  const to = toDate ? fortmatIsoStringToLocalTime(toDate) : null
  return (
    <span>
      {from} {to ? '-' : ''} {to}
    </span>
  )
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

const dateToReadableDay = (date: Date, locale: string, timeZone: string) => {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export const EventTimeMenu = ({ startDate }: EventTimeItemsProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const [eventData, setEventData] = useYValue<EventData>('meta.core/event[0].data')

  // const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const [selected, setSelected] = useState<Date[]>([new Date(`${startDate}T00:00:00`)])
  const [startTimeValue, setStartTimeValue] = useState<string>('00:00')
  const [endTimeValue, setEndTimeValue] = useState<string>('23:59')
  const [startDateValue, setStartDateValue] = useState<string>()
  const [endDateValue, setEndDateValue] = useState<string>()
  const [hasEndTime, setHasEndTime] = useState<boolean>()
  const { locale, timeZone } = useRegistry()
  const [mounted, setMounted] = useState(false)
  const [startTimeValid, setStartTimeValid] = useState(false)
  const [endTimeValid, setEndTimeValid] = useState(false)
  const [fullDay, setFullDay] = useState(true)

  useEffect(() => {
    if (!mounted && eventData) {
      const dates: Date[] = []

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
        const newStartDayWithTime = dateMidnight(startDateObject)
        dates.push(newStartDayWithTime)
      }

      if (eventData?.end) {
        const aDate = new Date(eventData.end.toString())
        const endValue = aDate.toLocaleString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        })
        setEndTimeValue(endValue)
        setEndDateValue(eventData.end)
        setHasEndTime(true)
        setEndTimeValid(testValid(endValue))

        const endDate = new Date(eventData.end)
        const newEndDayWithTime = dateMidnight(endDate)
        if (dates.length === 1 && (dates[0].getTime() !== newEndDayWithTime.getTime())) {
          dates.push(newEndDayWithTime)
        }
      }

      setSelected(dates)
      setMounted(true)
    }
  }, [eventData, mounted])

  const handleOnSelect = ({ eventStart, eventEnd, fullDay }: { eventStart: string, eventEnd: string, fullDay: boolean | undefined }) => {
    console.log('XXX event', eventStart, eventEnd, fullDay)
    let startDate = eventStart
    let endDate = eventEnd
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

  const handleStartTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setStartTimeValue(time)
    const valid = testValid(time)
    setStartTimeValid(valid)
    if (valid) {
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))
      const newSelectedDate = new Date(selected[0])
      newSelectedDate.setHours(hours, minutes)
      setStartDateValue(newSelectedDate.toISOString())
    }
  }

  const handleEndTime = (time: string): void => {
    const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))

    if (selected.length === 2) {
      const newSelectedDate = new Date(selected[1])
      newSelectedDate.setHours(hours, minutes)
      setEndDateValue(newSelectedDate.toISOString())
    } else {
      const newDate = new Date(selected[0])
      newDate.setHours(hours, minutes)
      setEndDateValue(newDate.toISOString())
    }
  }
  const handleEndTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setEndTimeValue(time)
    const valid = testValid(time)
    setEndTimeValid(valid)
    valid && handleEndTime(time)
  }

  const handleDayClick: CalendarTypes.DayClickEventHandler = (day, modifiers) => {
    const selectedDays = [...selected]

    if (modifiers.selected) {
      const index = selected.findIndex((d) => d.getTime() === day.getTime())
      selectedDays.splice(index, 1)
    } else {
      selectedDays.push(day)
    }
    selectedDays.sort((aDay, bDay) => aDay.getTime() - bDay.getTime())

    if (selectedDays.length > 0) {
      const endDate = selectedDays.length === 2 ? new Date(selectedDays[1]) : new Date(selectedDays[0])
      const [hours, minutes] = endTimeValue.split(':').map((str) => parseInt(str, 10))
      const newDayWithTime = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        hours,
        minutes
      )
      setEndDateValue(newDayWithTime.toISOString())

      const startDate = new Date(selectedDays[0])
      const [startHours, startMinutes] = startTimeValue.split(':').map((str) => parseInt(str, 10))

      const newStartDayWithTime = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startHours,
        startMinutes
      )
      setStartDateValue(newStartDayWithTime.toISOString())
    } else {
      setEndDateValue('')
    }

    if (selectedDays.length === 2) {
      setHasEndTime(true)
    }

    setSelected(selectedDays)
  }


  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }

  const handleCheckedChange = (checked: boolean): void => {
    setFullDay(checked)
  }
  const iconProps = {
    size: 18,
    strokeWidth: 1.75,
    className: 'text-muted-foreground'
  }

  const timePickType = {
    label: 'Välj tid',
    value: 'endexcecution',
    icon: CalendarClockIcon,
    iconProps
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className='flex flex-row space-x-2 items-center align-middle'>
          {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
          <DateLabel fromDate={eventData?.start} toDate={eventData?.end} />
        </div>
      </PopoverTrigger>
      <PopoverContent asChild align='center' side='bottom' sideOffset={-150}>
        <div>
          <Calendar
            mode='multiple'
            min={1}
            max={2}
            selected={selected}
            weekStartsOn={1}
            onDayClick={handleDayClick}
            initialFocus
            className='p-0'
          />
          <div className='flex pt-2 pb-2 '>
            <Switch onCheckedChange={checked => handleCheckedChange(checked)} checked={fullDay} className=' self-center' /><label className='text-sm self-center p-2'>Heldag</label>
          </div>
          <div className='flex justify-between border-2 rounded-md border-slate-100'>
            <div className='px-3 py-2 text-sm text-gray-400'>
              {startDateValue && dateToReadableDay(new Date(startDateValue), locale, timeZone)}
            </div>
            <div>
              <Input
                type='time'
                ref={inputRef}
                value={fullDay ? '' : startTimeValue}
                onChange={handleStartTimeChange}
                disabled={fullDay}
                placeholder={'hh:mm ex 11:00'}
                className="h-9 border-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false)
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()

                    handleOnSelect({
                      eventStart: startDateValue as string,
                      eventEnd: endDateValue as string,
                      fullDay: fullDay as boolean
                    })

                    setOpen(false)
                  }
                }}
              />
            </div>
          </div>
          <div className='flex justify-between border-2 rounded-md border-slate-100 mt-2'>
            <div className='px-3 py-2 text-sm text-gray-400'>
              {endDateValue && dateToReadableDay(new Date(endDateValue), locale, timeZone)}
            </div>
            <div>
              <Input
                type='time'
                ref={inputRef}
                value={fullDay ? '' : endTimeValue}
                onChange={handleEndTimeChange}
                disabled={fullDay}
                placeholder={'hh:mm ex 11:00'}
                className="h-9 border-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false)
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (startTimeValid && endTimeValid) {
                      handleOnSelect({
                        eventStart: startDateValue as string,
                        eventEnd: endDateValue as string,
                        fullDay: fullDay
                      })
                      setOpen(false)
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className='flex items-center justify-end gap-4 pt-2'>
            <Button
              variant="ghost"
              onClick={(evt) => {
                evt.preventDefault()
                evt.stopPropagation()
                setOpen(false)
              }}>
              Avbryt
            </Button>
            <Button
              variant="outline"
              disabled={hasEndTime ? (!startTimeValid || !endTimeValid) : !startTimeValid}
              onClick={(evt) => {
                evt.preventDefault()
                evt.stopPropagation()

                handleOnSelect({
                  eventStart: startDateValue as string,
                  eventEnd: endDateValue as string,
                  fullDay: fullDay
                })
                setOpen(false)
              }}
            >
              Klar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
