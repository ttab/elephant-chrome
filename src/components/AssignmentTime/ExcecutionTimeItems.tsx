import React, { useState, useRef, useEffect, ChangeEventHandler } from 'react'
import {
  Command,
  CommandInput,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Input
} from '@ttab/elephant-ui'
import { timePickTypes } from '.'
import { useYValue } from '@/hooks/useYValue'
import { AssignmentData } from '.'

import { useYObserver, useRegistry } from '@/hooks'

interface TimeSelectItem extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string,
  index: number
}


export const ExcecutionTimeItems = ({ handleOnSelect, index }: TimeSelectItem) => {
  const { timeZone } = useRegistry()
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const [endTime, setEndTime] = useState('')
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)

  const [selected, setSelected] = useState<Date>()
  const [timeValue, setTimeValue] = useState<string>("00:00")

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value;
    if (!selected) {
      setTimeValue(time)
      return
    }
    const [hours, minutes] = time.split(":").map((str: string) => parseInt(str, 10))

    // const newSelectedDate = setHours(setMinutes(selected, minutes), hours);
    const newSelectedDate = new Date() //XXX
    newSelectedDate.setHours(hours, minutes)
    setSelected(newSelectedDate)
    setTimeValue(time)
  };

  const handleDaySelect = (date: Date | undefined) => {
    if (!timeValue || !date) {
      setSelected(date)
      return;
    }
    const [hours, minutes] = timeValue
      .split(":")
      .map((str) => parseInt(str, 10))
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes
    )

    setSelected(newDate)
  };

  useEffect(() => {
    if (data?.end) {
      const aDate = new Date(data.end.toString())
      const endValue = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      setEndTime(endValue)
    }
  }, [data?.end])

  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }
  const timePickType = timePickTypes[0]

  const endDate = new Date(data?.end_date as string)

  return (
    <CommandItem
      className='border-t'
      key={timePickTypes[0].label}
      value={timePickTypes[0].label}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className='flex flex-row space-x-2 items-center  pt-2'>
            {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
            <div>Välj tid</div>
          </div>
        </PopoverTrigger>
        <PopoverContent>


          <Calendar
            mode='single'
            selected={selected}
            onSelect={handleDaySelect}
            initialFocus
            footer={`Selected date: ${selected ? selected.toLocaleString() : "none"}`}
          />
          <Command>
            <Input
              type='time'
              ref={inputRef}
              value={timeValue}
              onChange={handleTimeChange}

              placeholder={'hh:mm ex 11:00'}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleOnSelect({ value: timePickType.value, selectValue: endTime })
                  setOpen(false)
                }
              }}
            />
          </Command>

        </PopoverContent>
      </Popover>
    </CommandItem>
  )
}
