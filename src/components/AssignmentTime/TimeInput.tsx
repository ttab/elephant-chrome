import React, { useState, useRef, useEffect, type ChangeEventHandler } from 'react'
import {
  Input
} from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks'
import { dateToReadableDateTime } from '@/lib/datetime'

interface TimeInputProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleOnSave: (time: string) => void
  selectedDate: Date
  setDateTime: React.Dispatch<React.SetStateAction<string>>
  defaultDate: string | undefined
  defaultTime: string
  disabled: boolean
}

const testValid = (time: string): boolean => {
  return (/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
}

export const TimeInput = ({
  setOpen,
  handleOnSave,
  selectedDate,
  setDateTime,
  defaultDate,
  defaultTime,
  disabled
}: TimeInputProps): JSX.Element => {
  const [time, setTime] = useState<string>(defaultTime)
  const [validTime, setValidTime] = useState<boolean>(false)
  const inputRef = useRef(null)
  const { locale, timeZone } = useRegistry()

  // const inputValue = (endTimeComponent && !hasEndTime) ? '' : time
  // const disabled = endTimeComponent && !hasEndTime

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setTime(e.target.value)
    setValidTime(testValid(time))
    if (validTime) {
      const [hours, minutes] = time.split(':').map((str: string) => parseInt(str, 10))
      const newSelectedDate = new Date(selectedDate)
      newSelectedDate.setHours(hours, minutes)
      setDateTime(newSelectedDate.toISOString)
    }
  }

  if (defaultDate) {
    const aDate = new Date(defaultDate.toString())
    const defaultTime = aDate.toLocaleString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
    setTime(defaultTime)
  }

  return (
    <div className='flex justify-between border-2 rounded-md border-slate-100'>
      <div className='px-3 py-2 text-sm'>
        {time && dateToReadableDateTime(new Date(time), locale, timeZone)}
        <Input
          type='time'
          ref={inputRef}
          value={time}
          onChange={handleOnChange}
          disabled={disabled}
          placeholder={'hh:mm ex 11:00'}
          className="h-9 border-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              handleOnSave(time)
            }
          }}
        />
      </div>
    </div>
  )
}