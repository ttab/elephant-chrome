import { useState, useEffect, useCallback, type MouseEvent } from 'react'
import {
  Command,
  CommandItem,
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

  const timePickType = data?.end && data?.start ? timePickTypes.find((t) => t.value === 'start-end-execution') : timePickTypes[0]

  const handleConfirm = (evt: MouseEvent<HTMLButtonElement> | React.KeyboardEvent): void => {
    if (!timePickType) {
      return
    }

    evt.preventDefault()
    evt.stopPropagation()
    handleOnSelect({ value: timePickType.value, selectValue: endTime })
    setOpen(false)
    handleParentOpenChange(false)
  }

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
      <Command>
        <div className='flex flex-col py-2'>
          <>
            <TimeInput
              defaultTime={endTime}
              handleOnChange={handleTimeChange}
              handleOnSelect={handleOnTimeSelect}
              setOpen={setOpen}
            />
          </>

          <div className='flex items-center gap-2 px-2'>
            <Button
              variant='ghost'
              onClick={() => {
                setOpen(false)
                handleParentOpenChange(false)
              }}
              onKeyDown={(evt) => {
                if (evt.key === 'Escape' || evt.key === 'Enter') {
                  evt.preventDefault()
                  evt.stopPropagation()
                  setOpen(false)
                  handleParentOpenChange(false)
                }
              }}
            >
              Avbryt
            </Button>

            <Button
              variant='outline'
              onClick={handleConfirm}
              onKeyDown={handleConfirm}
              disabled={!valid}
            >
              Klar
            </Button>
          </div>
        </div>
      </Command>
    </CommandItem>
  )
}
