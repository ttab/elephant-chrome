import React, { useState, useEffect, type ChangeEventHandler } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  type CalendarTypes,
  Button,
  Switch
} from '@ttab/elephant-ui'
import { timePickTypes } from './constants'
import { useYValue } from '@/hooks/useYValue'
import { TimeDisplay } from '../DataItem/TimeDisplay'
import { type AssignmentData } from './types'
import { TimePicker } from './TimePicker'
interface ExecutionTimeItemsProps extends React.PropsWithChildren {
  handleOnSelect: ({ executionStart, executionEnd }: { executionStart: string | undefined, executionEnd: string | undefined }) => void
  className?: string
  index?: number
  startDate?: string
}

const IsoStringTimeDisplay = (isoString: string): JSX.Element => {
  const date = new Date(isoString)
  return <TimeDisplay date={date} />
}

const DateLabel = ({ fromDate, toDate }: { fromDate?: string | undefined, toDate?: string | undefined }): JSX.Element => {
  const from = fromDate ? IsoStringTimeDisplay(fromDate) : null
  const to = toDate ? IsoStringTimeDisplay(toDate) : null
  return (
    <span>
      {from} {to ? '-' : ''} {to}
    </span>
  )
}

const testValid = (time: string): boolean => {
  return (/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
}

export const ExecutionTimeMenu = ({ handleOnSelect, index, startDate }: ExecutionTimeItemsProps): JSX.Element => {
  const [open, setOpen] = useState(false) // show popover
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const [selected, setSelected] = useState<Date[]>([new Date(`${startDate}T00:00:00`)]) // Calendar dates
  // const [startTimeValue, setStartTimeValue] = useState<string>('00:00') // Input time
  // const [endTimeValue, setEndTimeValue] = useState<string>('23:59') // Input time
  const [startDateValue, setStartDateValue] = useState<string>() // Value to save
  const [endDateValue, setEndDateValue] = useState<string>()  // Value to save
  const [hasEndTime, setHasEndTime] = useState<boolean>(false) // If end time switch enabled
  const [mounted, setMounted] = useState(false)
  // const [startTimeValid, setStartTimeValid] = useState(false) // valid hh:mm format
  const [endTimeValid, setEndTimeValid] = useState(false) // valid hh:mm format

  useEffect(() => {
    if (!mounted && data) {
      const dates: Date[] = []

      if (data?.start) {
        const aDate = new Date(data.start.toString())
        const startValue = aDate.toLocaleString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        })
        setStartTimeValue(startValue)
        setStartDateValue(data.start)
        setStartTimeValid(testValid(startValue))

        const startDateObject = new Date(data.start)
        const newStartDayWithTime = new Date(
          startDateObject.getFullYear(),
          startDateObject.getMonth(),
          startDateObject.getDate(),
          0,
          0,
          0,
          0
        )
        dates.push(newStartDayWithTime)
      }

      if (data?.end) {
        const aDate = new Date(data.end.toString())
        const endValue = aDate.toLocaleString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit'
        })
        setEndTimeValue(endValue)
        setEndDateValue(data.end)
        setHasEndTime(true)
        setEndTimeValid(testValid(endValue))

        const endDate = new Date(data.end)
        const newEndDayWithTime = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          0,
          0,
          0,
          0
        )
        if (dates.length === 1 && (dates[0].getTime() !== newEndDayWithTime.getTime())) {
          dates.push(newEndDayWithTime)
        }
      }

      setSelected(dates)
      setMounted(true)
    }
  }, [data, mounted])

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
    setHasEndTime(checked)
    handleEndTime(endTimeValue)
  }

  const timePickType = timePickTypes[1]

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className='flex flex-row space-x-2 items-center align-middle'>
          {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
          <DateLabel fromDate={data?.start} toDate={data?.end} />
        </div>
      </PopoverTrigger>
      <PopoverContent>
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

          <TimePicker
            isEndTime={false}
            setOpen={setOpen}
            handleOnSave={() => { }}
            selectedDate={selected[0]}
            hasEndTime={hasEndTime}
            defaultDate={data?.start}
          />
          <div className='pt-2 pb-2'>
            <Switch onCheckedChange={handleCheckedChange} checked={hasEndTime}>Från-till</Switch>
          </div>
          <TimePicker
            isEndTime={true}
            setOpen={setOpen}
            handleOnSave={() => { }}
            selectedDate={selected.length === 2 ? selected[1] : selected[0]}
            hasEndTime={hasEndTime}
            defaultDate={data?.end}
          />

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
                  executionStart: startDateValue,
                  executionEnd: hasEndTime ? endDateValue : undefined
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
