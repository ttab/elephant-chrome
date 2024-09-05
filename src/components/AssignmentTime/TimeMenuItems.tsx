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

import { timeSlotTypes } from '.'
interface TimeMenuItemsProps extends React.PropsWithChildren {
  handleOnSelect: ({value, selectValue}: {value: string, selectValue: string}) => void
}

export const TimeMenuItems = ({ handleOnSelect }: TimeMenuItemsProps): JSX.Element[] => {
  return (
    timeSlotTypes.map((slot) => (
      <CommandItem
        key={slot.label}
        value={slot.value}
        onSelect={(value: string) => {
          handleOnSelect({value: slot.value, selectValue: value})
        }}
      >
        <div className='flex flex-row space-x-2 items-center'>
          {slot?.icon && <slot.icon {...slot.iconProps} />}
          <div>{slot.label}</div>
        </div>
      </CommandItem>
    )
    )
  )
}
