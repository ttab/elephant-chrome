import { useState, useEffect, useCallback } from 'react'
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

export const TimeSelectItem = ({ handleOnSelect, index, handleParentOpenChange }: {
  handleOnSelect: ({ value, selectValue }: { value: string, selectValue: string }) => void
  className?: string
  index: number
  handleParentOpenChange: (open: boolean) => void
}): JSX.Element => {
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

  const handleOpenChange = useCallback((isOpen: boolean): void => {
    setOpen(isOpen)
  }, [])

  const handleTimeChange = useCallback((time: string): void => {
    setEndTime(time)
    setValid(/^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(time))
  }, [])

  const handleOnTimeSelect = useCallback((): void => {
    if (valid) {
      handleOnSelect({ value: timePickTypes[0].value, selectValue: endTime })
      setOpen(false)
      handleParentOpenChange(false)
    }
  }, [valid, endTime, handleOnSelect, handleParentOpenChange])

  const timePickType = timePickTypes[0]
  return (
    <CommandItem
      key={timePickTypes[0].label}
      value={timePickTypes[0].label}
      onSelect={(item) => {
        if (item === 'Välj tid') {
          setOpen(!open)
        } else {
          handleParentOpenChange(false)
        }
      }}
    >
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant='ghost'
            className='flex flex-row space-x-2 items-center grow'
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                setOpen(!open)
              }
            }}
          >
            {timePickType.icon && <timePickType.icon {...timePickType.iconProps} />}
            Välj tid
          </Button>
        </PopoverTrigger>

        <PopoverContent className='p-0' align='start' side='right'>
          <Command>
            <div className='py-2'>
              <div className='p-2'>
                <TimeInput
                  defaultTime={endTime}
                  handleOnChange={handleTimeChange}
                  handleOnSelect={handleOnTimeSelect}
                  setOpen={setOpen}
                />
              </div>

              <div className='flex items-center justify-end gap-4 px-2 pt-2'>
                <Button
                  variant='ghost'
                  onClick={() => setOpen(false)}
                  onKeyDown={(evt) => {
                    if (evt.key === 'Escape' || evt.key === 'Enter') {
                      evt.preventDefault()
                      evt.stopPropagation()
                      setOpen(false)
                    }
                  }}
                >
                  Avbryt
                </Button>

                <Button
                  variant='outline'
                  onClick={(evt) => {
                    evt.preventDefault()
                    evt.stopPropagation()
                    handleOnSelect({ value: timePickType.value, selectValue: endTime })
                    setOpen(false)
                    handleParentOpenChange(false)
                  }}
                  onKeyDown={(evt) => {
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
