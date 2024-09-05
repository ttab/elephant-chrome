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
import { DebouncedCommandInput } from '../Commands/Menu/DebouncedCommandInput'

interface TimeSelectItem extends React.PropsWithChildren {
  handleOnSelect: ({value, selectValue}: {value: string, selectValue: string}) => void
  className?: string
}
export const TimeSelectItem = ({ handleOnSelect }: TimeSelectItem) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const [value, setValue] = useState('')

  const handleOpenChange = (isOpen: boolean): void => {
    // onOpenChange && onOpenChange(isOpen)

    setOpen(isOpen)
  }
  const timePickType = timePickTypes[0]

  const handleInput = (value: string) => {

  }

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

            <DebouncedCommandInput
              ref={inputRef}
              value={''}
              onChange={(value: string | undefined) => {
                handleOnSelect({value: timePickType.value, selectValue: value ? value : ''})
              }}
              placeholder={'11:00'}
              className="h-9"
            />
          </Command>
          {/* <Input
            placeholder='10:00'
            onChange={(e) => handleSelect(e.currentTarget.value)}
            ref={inputRef}
            /> */}
        </PopoverContent>
      </Popover>
    </CommandItem>
  )
}