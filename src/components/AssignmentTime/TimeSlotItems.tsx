import {
  CommandItem
} from '@ttab/elephant-ui'

import { timeSlotTypes } from '../../defaults/assignmentTimeConstants'

export const TimeSlotItems = ({ handleOnSelect, handleParentOpenChange }: {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  handleParentOpenChange: (open: boolean) => void
}): JSX.Element[] => {
  return timeSlotTypes.map((slot) => {
    const onSelect = (value: string) => {
      handleOnSelect({ value: slot.value, selectValue: value })
      handleParentOpenChange(false)
    }

    return (
      <CommandItem key={slot.label} value={slot.label} onSelect={onSelect}>
        <div className='flex flex-row space-x-2 items-center'>
          {slot?.icon && <slot.icon {...slot.iconProps} />}
          <div>{slot.label}</div>
        </div>
      </CommandItem>
    )
  })
}
