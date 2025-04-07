import React, { useState, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  type CalendarTypes,
  Button,
  Switch
} from '@ttab/elephant-ui'
import { timePickTypes } from '../../defaults/assignmentTimeConstants'
import { useYValue } from '@/hooks/useYValue'
import { dateToReadableDateTime, createDateWithTime } from '@/lib/datetime'
import { useRegistry } from '@/hooks'
import { type AssignmentData } from './types'
import { TimeInput } from '../TimeInput'
import { FromDateTimeLabel, FromToDateTimeLabel } from './ExecutionTimeLabel'
interface ExecutionTimeItemsProps extends React.PropsWithChildren {
  handleOnSelect: ({ executionStart, executionEnd }: { executionStart: string | undefined, executionEnd: string | undefined }) => void
  className?: string
  index?: number
  startDate?: string
}

const testValid = (time: string): boolean => {
  return (/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
}

export const ExecutionTimeMenu = ({ handleOnSelect, index, startDate }: ExecutionTimeItemsProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const [selected, setSelected] = useState<CalendarTypes.DateRange | undefined>({ from: new Date(`${startDate}T00:00:00`) })
  const [startTimeValue, setStartTimeValue] = useState<string>('00:00')
  const [endTimeValue, setEndTimeValue] = useState<string>('23:59')
  const [startDateValue, setStartDateValue] = useState<string>('')
  const [endDateValue, setEndDateValue] = useState<string>('')
  const [hasEndTime, setHasEndTime] = useState<boolean>()
  const { locale, timeZone } = useRegistry()
  const [mounted, setMounted] = useState(false)
  const [startTimeValid, setStartTimeValid] = useState(false)
  const [endTimeValid, setEndTimeValid] = useState(false)

  useEffect(() => {
    if (!mounted && data) {
      const savedDates: CalendarTypes.DateRange = { from: undefined, to: undefined }

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
        const newStartDayWithTime = createDateWithTime(startDateObject, '00:00')
        savedDates.from = newStartDayWithTime
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
        const newEndDayWithTime = createDateWithTime(endDate, '00:00')
        savedDates.to = newEndDayWithTime
      }

      setSelected(savedDates)
      setMounted(true)
    }
  }, [data, mounted])

  const handleStartTimeChange = (time: string): void => {
    setStartTimeValue(time)
    const valid = testValid(time)
    setStartTimeValid(valid)
    if (valid && selected?.from) {
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))
      const newSelectedDate = new Date(selected.from)
      newSelectedDate.setHours(hours, minutes)
      setStartDateValue(newSelectedDate.toISOString())
    }
  }

  const handleEndTimeChange = (time: string): void => {
    setEndTimeValue(time)
    const valid = testValid(time)
    setEndTimeValid(valid)
    if (valid) {
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))

      if (selected?.to) {
        const newSelectedDate = new Date(selected.to)
        newSelectedDate.setHours(hours, minutes)
        setEndDateValue(newSelectedDate.toISOString())
      } else if (selected?.from) {
        const newDate = new Date(selected.from)
        newDate.setHours(hours, minutes)
        setEndDateValue(newDate.toISOString())
      }
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

      if (selectedDays.to !== selectedDays.from) {
        setHasEndTime(true)
      }
    }
  }

  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }

  const handleHasEndTime = (checked: boolean): void => {
    setHasEndTime(checked)
    handleEndTimeChange(endTimeValue)
  }

  const handleOnTimeSelect = (): void => {
    if (hasEndTime ? (!startTimeValid || !endTimeValid) : !startTimeValid) {
      handleOnSelect({
        executionStart: startDateValue,
        executionEnd: hasEndTime ? endDateValue : undefined
      })
    }
  }

  const timePickType = timePickTypes[1]

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className='flex flex-row space-x-2 items-center align-middle cursor-pointer'>
          {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
          {
            hasEndTime
              ? <FromToDateTimeLabel fromDate={startDateValue} toDate={endDateValue} locale={locale.code.full} timeZone={timeZone} />
              : <FromDateTimeLabel fromDate={startDateValue} locale={locale.code.full} timeZone={timeZone} />
          }
        </div>
      </PopoverTrigger>
      <PopoverContent>
        <div>
          <Calendar
            mode='range'
            required={false}
            selected={selected}
            weekStartsOn={1}
            onSelect={handleOnSelectDay}
            className='p-0'
          />
          <div className='flex justify-between border-2 rounded-md border-slate-100'>
            <div className='px-3 py-2 text-sm'>
              {startDateValue && dateToReadableDateTime(new Date(startDateValue), locale.code.full, timeZone)}
            </div>
            <div>
              <TimeInput
                defaultTime={startTimeValue}
                handleOnChange={handleStartTimeChange}
                handleOnSelect={handleOnTimeSelect}
                setOpen={setOpen}
              />
            </div>
          </div>
          <div>
            <div className='flex pt-2 pb-2'>
              <Switch onCheckedChange={handleHasEndTime} checked={hasEndTime} className='self-center'></Switch>
              <label className='text-sm self-center p-2'>Tid från-till</label>
            </div>
            <div className='flex justify-between border-2 rounded-md border-slate-100'>
              <div className='px-3 py-2 text-sm'>
                {(hasEndTime && endDateValue) && dateToReadableDateTime(new Date(endDateValue), locale.code.full, timeZone)}
              </div>
              <div>
                <TimeInput
                  defaultTime={endTimeValue}
                  handleOnChange={handleEndTimeChange}
                  handleOnSelect={handleOnTimeSelect}
                  setOpen={setOpen}
                  disabled={!hasEndTime}
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
