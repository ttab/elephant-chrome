import React, { useState, useEffect } from 'react'
import {
  Command,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button
} from '@ttab/elephant-ui'
import { timePickTypes } from '../../defaults/assignmentTimeConstants'
import { useYValue } from '@/hooks/useYValue'
import { type AssignmentData } from './types'
import { TimeInput } from '../TimeInput'
interface TimeSelectItemProps extends React.PropsWithChildren {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  index: number
  handleParentOpenChange: (open: boolean) => void
}
export const TimeSelectItem = ({ handleOnSelect, index, handleParentOpenChange }: TimeSelectItemProps): JSX.Element => {
  const [open, setOpen] = useState(false)
  const [endTime, setEndTime] = useState('')
  const [data] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    if (data?.end) {
      const aDate = new Date(data.end.toString())
      const endValue = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      setEndTime(endValue)
    }
  }, [data?.end])

  const handleOpenChange = (isOpen: boolean): void => {
    setOpen(isOpen)
  }

  const handleTimeChange = (time: string): void => {
    setEndTime(time)
    setValid(/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
  }

  const handleOnTimeSelect = (): void => {
    if (valid) {
      handleOnSelect({ value: timePickType.value, selectValue: endTime })
      setOpen(false)
      handleParentOpenChange(false)
    }
  }
  const timePickType = timePickTypes[0]

  return (
    <CommandItem
      key={timePickTypes[0].label}
      value={timePickTypes[0].label}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className='flex flex-row space-x-2 items-center grow'>
            {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
            <div>Välj tid</div>
          </div>
        </PopoverTrigger>

        <PopoverContent className='p-0'>
          <Command>
            <div className='py-2'>
              <div className='p-2'>
                <TimeInput defaultTime={endTime} handleOnChange={handleTimeChange} handleOnSelect={handleOnTimeSelect} setOpen={setOpen} />
              </div>

              <div className='flex items-center justify-end gap-4 px-2 pt-2'>
                <Button
                  variant="ghost"
                  onClick={(evt) => {
                    evt.preventDefault()
                    evt.stopPropagation()
                    setOpen(false)
                    handleParentOpenChange(false)
                  }}>
                  Avbryt
                </Button>

                <Button
                  variant="outline"
                  onClick={(evt) => {
                    evt.preventDefault()
                    evt.stopPropagation()
                    handleOnSelect({ value: timePickType.value, selectValue: endTime })
                    setOpen(false)
                    handleParentOpenChange(false)
                  }}
                  disabled={!valid}
                >
                  Klar
                </Button>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </CommandItem>
  )
}
