import React, { useState, useRef, useEffect, type ChangeEventHandler } from 'react'
import {
  Command,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
  Button
} from '@ttab/elephant-ui'
import { timePickTypes } from './constants'
import { useYValue } from '@/hooks/useYValue'
import { type AssignmentData } from './types'
interface TimeSelectItemProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  index: number
  handleParentOpenChange: (open: boolean) => void
}
export const TimeSelectItem = ({ handleOnSelect, index, handleParentOpenChange }: TimeSelectItemProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const [endTime, setEndTime] = useState('')
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)

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

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const time = e.target.value
    setEndTime(time)
  }
  const timePickType = timePickTypes[0]

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
          <Command>
            <Input
              type='time'
              ref={inputRef}
              value={endTime}
              onChange={handleTimeChange}
              placeholder={'hh:mm ex 11:00'}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                  handleParentOpenChange(false)
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleOnSelect({ value: timePickType.value, selectValue: endTime })
                  setOpen(false)
                  handleParentOpenChange(false)
                }
              }}
            />
            <div className='flex items-center justify-end gap-4 p-2'>
              <Button
                variant="ghost"
                onClick={(evt) => {
                  evt.preventDefault()
                  evt.stopPropagation()
                  setOpen(false)
                  handleParentOpenChange(false)
                }}>
                Avbryt
              </Button>

              <Button
                variant="outline"
                onClick={(evt) => {
                  evt.preventDefault()
                  evt.stopPropagation()
                  handleOnSelect({ value: timePickType.value, selectValue: endTime })
                  setOpen(false)
                  handleParentOpenChange(false)
                }}
              >
                Klar
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </CommandItem>
  )
}
