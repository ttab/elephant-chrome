import React, { useState } from 'react'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'

import { TimeSlotItems } from './TimeSlotItems'
import { TimeSelectItem } from './TimeSelectItem'
interface TimeMenuProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  index: number
}

export const TimeDeliveryMenu = ({
  children,
  handleOnSelect,
  index
}: TimeMenuProps): React.JSX.Element => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='ghost'
          className='h-9 font-sans font-normal whitespace-nowrap p-0'
          onKeyDown={(event) => {
            if (event.key !== 'Escape') {
              event?.stopPropagation()
            }
          }}
        >
          {children}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='p-0'
        align='start'
        onEscapeKeyDown={(event) => event?.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder='' />
          <CommandList>
            <CommandEmpty>Ingenting hittades</CommandEmpty>
            <div className='flex flex-col divide-y'>
              <CommandGroup>
                <TimeSlotItems handleOnSelect={handleOnSelect} handleParentOpenChange={handleOpenChange} />
              </CommandGroup>
              <CommandGroup>
                <TimeSelectItem handleOnSelect={handleOnSelect} index={index} handleParentOpenChange={handleOpenChange} />
              </CommandGroup>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
