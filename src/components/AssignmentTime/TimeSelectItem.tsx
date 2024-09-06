import React, { useState, type PropsWithChildren, useRef, useEffect } from 'react'
import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  CommandShortcut,
  Input
} from '@ttab/elephant-ui'

import { timePickTypes } from '.'
import { useYValue } from '@/hooks/useYValue'

interface TimeSelectItem extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string,
  index: number
}
export const TimeSelectItem = ({ handleOnSelect, index }: TimeSelectItem) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const [endTime, setEndTime] = useState('')
  const [end] = useYValue<String>(`meta.core/assignment[${index}].data.end`)
  const [endValue, setEndValue] = useState('')
  console.log('XXX end', end)

  useEffect(() => {
    if (end) {
      const aDate = new Date(end.toString())
      const endValue = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      setEndValue(endValue)
    }
  }, [end])

  const handleOpenChange = (isOpen: boolean): void => {
    // onOpenChange && onOpenChange(isOpen)

    setOpen(isOpen)
  }
  const timePickType = timePickTypes[0]




  return (
    <CommandItem
      className='border-t'
      key={timePickTypes[0].label}
      value={timePickTypes[0].value}
    // onSelect={handleOnSelect}
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
              value={endTime || endValue}
              onValueChange={(value: string | undefined) => {
                console.log('XX onChange', value)
                setEndTime(value as string)
                // handleOnSelect({value: timePickType.value, selectValue: value ? value : ''})
              }}
              placeholder={'hh:mm ex 11:00'}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                }
                if (e.key === 'Enter') {
                  console.log('XXX time', endTime)
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