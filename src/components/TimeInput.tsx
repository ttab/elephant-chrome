import type { MouseEvent, KeyboardEvent, Dispatch, SetStateAction } from 'react'
import { useState, type ChangeEventHandler } from 'react'
import {
  Input
} from '@ttab/elephant-ui'

export const TimeInput = ({ defaultTime, handleOnChange, handleOnSelect, setOpen, disabled = false }: {
  defaultTime: string
  handleOnChange: (time: string) => void
  handleOnSelect: (event: MouseEvent<HTMLButtonElement> | KeyboardEvent) => void
  setOpen: Dispatch<SetStateAction<boolean>>
  disabled?: boolean
}): JSX.Element => {
  const [timeValue, setTimeValue] = useState<string>(defaultTime)

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setTimeValue(time)
    handleOnChange(time)
  }

  return (
    <Input
      type='time'
      value={!disabled ? timeValue : ''}
      onChange={handleTimeChange}
      placeholder='hh:mm ex 11:00'
      className='h-8 text-sm border-none'
      disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          handleOnSelect(e)
          setOpen(false)
        }
      }}
    />
  )
}
