import React from 'react'
import {
  CommandItem
} from '@ttab/elephant-ui'

import { timeSlotTypes } from '../../defaults/assignmentTimeConstants'
interface TimeMenuItemsProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
}

export const TimeSlotItems = ({ handleOnSelect }: TimeMenuItemsProps): JSX.Element[] => {
  return (
    timeSlotTypes.map((slot) => (
      <CommandItem
        key={slot.label}
        value={slot.label}
        onSelect={(value: string) => {
          handleOnSelect({ value: slot.value, selectValue: value })
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
