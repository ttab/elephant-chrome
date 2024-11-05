import { useRef, useState, type ChangeEventHandler  } from 'react'
import {
  Input
} from '@ttab/elephant-ui'

interface TimeInpuProps {
  defaultTime: string
  handleOnChange: (time: string) => void
  handleOnSelect: () => void
  setOpen: React.Dispatch<React.SetStateAction<boolean>>

 }


export const TimeInput = ({defaultTime, handleOnChange, handleOnSelect, setOpen}: TimeInpuProps) => {
  const inputRef = useRef(null)
  const [timeValue, setTimeValue] = useState<string>(defaultTime)

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setTimeValue(time)
    handleOnChange(time)
  }

  return (

    <Input
      type='time'
      ref={inputRef}
      value={timeValue}
      onChange={handleTimeChange}
      placeholder={'hh:mm ex 11:00'}
      className="h-9 border-none"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false)
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          handleOnSelect()
          // if (hasEndTime ? (!startTimeValid || !endTimeValid) : !startTimeValid) {
          //   handleOnSelect({
          //     executionStart: startDateValue,
          //     executionEnd: hasEndTime ? endDateValue : undefined
          //   })
          // }
          setOpen(false)
        }
      }}
    />
  )
}