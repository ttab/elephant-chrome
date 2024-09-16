import React, { useState, useRef, useEffect } from 'react'
import {
  Command,
  CommandInput,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@ttab/elephant-ui'
import { timePickTypes } from '.'
import { useYValue } from '@/hooks/useYValue'
import { AssignmentData } from '.'
interface TimeSelectItem extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string,
  index: number
}
export const TimeSelectItem = ({ handleOnSelect, index }: TimeSelectItem) => {
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
            <CommandInput
              ref={inputRef}
              value={endTime}
              onValueChange={(value: string | undefined) => {
                setEndTime(value as string)
              }}
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