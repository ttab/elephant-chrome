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
  PopoverTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  CommandShortcut
} from '@ttab/elephant-ui'

import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
import { type DefaultValueOption } from '@/types/index'
import { TimeSlotItems } from './TimeSlotItems'
import { TimeSelectItem } from './TimeSelectItem'
interface TimeMenuProps extends React.PropsWithChildren {
  handleOnSelect: ({value, selectValue}: {value: string, selectValue: string}) => void
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
          variant={'outline'}
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
              <TimeSlotItems handleOnSelect={handleOnSelect}/>
            </CommandGroup>
            <CommandGroup>
              <TimeSelectItem handleOnSelect={handleOnSelect} index={index} handleParentOpenChange={handleOpenChange}/>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}