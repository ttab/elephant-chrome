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

import { type DefaultValueOption } from '@/types/index'
import { TimeSlotItems } from './TimeSlotItems'
import { TimeSelectItem } from './TimeSelectItem'
interface TimeMenuProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  selectedOption?: DefaultValueOption
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
          size={'sm'}
          variant={'ghost'}
          className={'h-9 text-muted-foreground font-sans font-normal whitespace-nowrap p-0'}
        >
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder='' />
          <CommandList>
            <CommandEmpty>Ingenting hittades</CommandEmpty>
            <CommandGroup>
              <TimeSlotItems handleOnSelect={handleOnSelect} />
            </CommandGroup>
            <CommandGroup>
              <TimeSelectItem handleOnSelect={handleOnSelect} index={index} handleParentOpenChange={handleOpenChange} />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
