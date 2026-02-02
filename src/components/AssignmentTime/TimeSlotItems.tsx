import { CommandItem } from '@ttab/elephant-ui'
import type { JSX } from 'react'
import { timeSlotTypes as slotTypes } from '../../defaults/assignmentTimeConstants'
import type { AssignmentValueOption } from './types'
import type { TFunction } from 'i18next'

export const TimeSlotItems = ({ handleOnSelect, handleParentOpenChange, assignmentType, t }: {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  handleParentOpenChange: (open: boolean) => void
  assignmentType?: string
  t: TFunction
}): JSX.Element[] => {
  const timeSlotTypes = (assignmentType?: string) => {
    if (!assignmentType) {
      return slotTypes
    }

    const noFullday = ['text', 'flash', 'editorial-info']
    return slotTypes.filter((slotType: AssignmentValueOption) => {
      if (noFullday.includes(assignmentType) && slotType.value === 'fullday') {
        return false
      }
      return true
    })
  }

  return timeSlotTypes(assignmentType).map((slot) => {
    const onSelect = (value: string) => {
      handleOnSelect({ value: slot.value, selectValue: value })
      handleParentOpenChange(false)
    }

    return (
      <CommandItem key={slot.label} value={slot.label} onSelect={onSelect}>
        <div className='flex flex-row space-x-2 items-center'>
          {slot?.icon && <slot.icon {...slot.iconProps} />}
          <div>{t(`core:timeSlots.${slot.value}`)}</div>
        </div>
      </CommandItem>
    )
  })
}
