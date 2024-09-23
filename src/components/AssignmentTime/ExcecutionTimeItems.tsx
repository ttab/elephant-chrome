import React, { useState, useRef, useEffect, ChangeEventHandler } from 'react'
import {
  Command,
  CommandInput,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Input,
  CalendarTypes,
  Button,
  Switch
} from '@ttab/elephant-ui'
import { timePickTypes } from '.'
import { useYValue } from '@/hooks/useYValue'
import { AssignmentData } from '.'

// import { useYObserver, useRegistry } from '@/hooks'

// import { DayMouseEventHandler,  DayClickEventHandler } from './types'


interface ExcecutionTimeItemsProps extends React.PropsWithChildren {
  handleOnSelect: ({ excecutionStart, executionEnd }: { excecutionStart: string | undefined, executionEnd: string | undefined }) => void
  className?: string,
  index?: number,
  startDate: string
}


export const ExcecutionTimeItems = ({ handleOnSelect, index, startDate }: ExcecutionTimeItemsProps) => {

  // const { timeZone } = useRegistry()
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  // const [endTime, setEndTime] = useState('')
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)

  const [selected, setSelected] = useState<Date[]>([new Date(`${startDate}T00:00:00`)])
  const [startTimeValue, setStartTimeValue] = useState<string>("00:00")
  const [endTimeValue, setEndTimeValue] = useState<string>("23:59")
  const [startDateValue, setStartDateValue] = useState<string>()
  const [endDateValue, setEndDateValue] = useState<string>()
  const [hasEndTime, setHasEndTime] = useState<boolean>()

  console.log('XXX endDateValue', endDateValue)

  useEffect(() => {
    const dates: Date[] = []

    if (data?.start) {
      const aDate = new Date(data.start.toString())
      const startValue = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      setStartTimeValue(startValue)
      setStartDateValue(data.start)


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
  }, [])

  const handleStartTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value;

    const [hours, minutes] = time.split(":").map((str: string) => parseInt(str, 10))

    const newSelectedDate = new Date(selected[0])
    newSelectedDate.setHours(hours, minutes)
    setStartTimeValue(time)
    setStartDateValue(newSelectedDate.toISOString())
  }

  const handleEndTime = (time: string) => {
    const [hours, minutes] = time.split(":").map((str: string) => parseInt(str, 10))

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
    const time = e.target.value;
    setEndTimeValue(time)
    handleEndTime(time)
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
      const [hours, minutes] = (endTimeValue ? endTimeValue : '23:59')
        .split(":")
        .map((str) => parseInt(str, 10))
      const newDayWithTime = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        hours,
        minutes
      )
      setEndDateValue(newDayWithTime.toISOString())

      const startDate = new Date(selectedDays[0])
      const [startHours, startMinutes] = (startTimeValue ? startTimeValue : '00:00')
        .split(":")
        .map((str) => parseInt(str, 10))

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

  const handleCheckedChange = (checked: boolean) => {
    setHasEndTime(checked)
    handleEndTime(endTimeValue)

  }

  const timePickType = timePickTypes[1]


  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className='flex flex-row space-x-2 items-center  pt-2'>
          {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
          <div>Välj tid</div>
        </div>
      </PopoverTrigger>
      <PopoverContent>


        <Calendar
          mode='multiple'
          min={1}
          max={2}
          selected={selected}
          weekStartsOn={1}
          onDayClick={handleDayClick}
          initialFocus
          // footer={`Selected date: ${selected ? selected.toLocaleString() : "none"}`}
          disabled={data?.start ? { before: new Date(data.start) } : { before: new Date() }}

        />
        <div>
          <div>
            <label>Start: </label><label>{startDateValue}</label>
          </div>
          <Input
            type='time'
            ref={inputRef}
            value={startTimeValue}
            onChange={handleStartTimeChange}

            placeholder={'hh:mm ex 11:00'}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                // handleOnSelect({ value: timePickType.value, selectValue: selected?.toISOString() || '' })
                setOpen(false)
              }
            }}
          />

        </div>
        <div>
          <div>

            <Switch onCheckedChange={handleCheckedChange} checked={hasEndTime}>Från-till</Switch>
          </div>
          <div>
            <label>Slut: </label><label>{endDateValue}</label>
          </div>
          <Input
            type='time'
            ref={inputRef}
            value={hasEndTime ? endTimeValue : ''}
            onChange={handleEndTimeChange}
            disabled={!hasEndTime}
            placeholder={'hh:mm ex 11:00'}
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                // handleOnSelect({ value: timePickType.value, selectValue: selected?.toISOString() || '' })
                setOpen(false)
              }
            }}
          />

        </div>
        <div className='flex items-center justify-end gap-4'>
          <Button
            variant="ghost"
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()
              // onAbort()
            }}>
            Avbryt
          </Button>


          <Button
            variant="outline"
            // disabled={!hasEndTime}
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()
              handleOnSelect({
                excecutionStart: startDateValue,
                executionEnd: hasEndTime ? endDateValue : undefined
              })
              // onClose()
            }}
          >
            Klar
          </Button>
        </div>

      </PopoverContent>
    </Popover>
  )
}
