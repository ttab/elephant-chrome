import React, { useState, type PropsWithChildren, useRef, useEffect } from 'react'
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
  CommandShortcut
} from '@ttab/elephant-ui'

import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'


import { TimeMenuItems } from './TimeMenuItems'

export const TimeMenu = ({ children }: PropsWithChildren): React.JSX.Element => {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean): void => {
    // onOpenChange && onOpenChange(isOpen)
    setOpen(isOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size={'sm'}
          variant={'outline'}
          className={'w-9 h-9 text-muted-foreground font-sans font-normal whitespace-nowrap p-0'}
        >
          {children}
        </Button>

      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder='label for something' />
          <CommandList>
            <CommandEmpty>Ingenting hittades</CommandEmpty>
            <CommandGroup>
              <TimeMenuItems />
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                className='border-t'
                key={'Heldag'}
                value={'Heldag'}
                onSelect={() => {
                  console.log('XXX Full day')
                }}
              >
                <div className='flex flex-row space-x-2 items-center  pt-2'>
                  <CalendarFoldIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
                  <div>Välj tid</div>
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

    </Popover>
  )

}