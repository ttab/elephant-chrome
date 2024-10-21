import { useState } from "react"
import { TimeInput } from "./TimeInput"

interface TimePickerProps {
  isEndTime: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleOnSave: (time: string) => void
  selectedDate: Date
  defaultDate: string | undefined
  hasEndTime: boolean
}


export const TimePicker = ({
  isEndTime,
  selectedDate,
  defaultDate,
  setOpen,
  handleOnSave,
  hasEndTime
}: TimePickerProps): JSX.Element => {

  const [dateTimeString, setDateTimeString] = useState<string>() // Value to save

  const setDateTime = () => {

  }

  const handleSaveTime = () => {

  }



  const disabled = isEndTime && !hasEndTime

  return (

    <TimeInput
      setOpen={setOpen}
      handleOnSave={handleOnSave}
      selectedDate={selectedDate}
      setDateTime={setDateTime}
      defaultDate={defaultDate}
      defaultTime={isEndTime ? '23:59' : '00:00'}
      disabled={disabled}
    />


  )
}
