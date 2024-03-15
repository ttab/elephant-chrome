import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { DatePicker } from './Datepicker'
import {
  useEffect,
  type Dispatch,
  type SetStateAction
} from 'react'
import { useView } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'

interface DateChangerProps {
  startDate: Date
  setStartDate: Dispatch<SetStateAction<Date>>
  endDate?: Date
  setEndDate?: Dispatch<SetStateAction<Date>>
}

// FIXME: Implement handling of date intervals, commented out at the moment

export const DateChanger = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: DateChangerProps): JSX.Element => {
  const { isActive } = useView()
  const steps = !!endDate && !!setEndDate ? 7 : 1

  useEffect(() => {
    const keyDownHandler = (evt: KeyboardEvent): void => {
      if (!isActive || isEditableTarget(evt)) {
        return
      }

      if (evt.key === 'ArrowLeft') {
        evt.stopPropagation()
        setStartDate(decrementDate(startDate, steps))
      } else if (evt.key === 'ArrowRight') {
        evt.stopPropagation()
        setStartDate(incrementDate(startDate, steps))
      }
    }

    document.addEventListener('keydown', keyDownHandler)
    return () => document.removeEventListener('keydown', keyDownHandler)
  }, [isActive, setStartDate, startDate, steps])

  return (
    <div className="flex items-center">
      <ChevronLeft
        strokeWidth={1.75}
        className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
        onClick={() => setStartDate(decrementDate(startDate, steps))}
      />

      <DatePicker date={startDate} setDate={setStartDate} />

      {/* {!!endDate && !!setEndDate &&
        <DatePicker date={endDate} setDate={setEndDate} />
      } */}

      <ChevronRight
        strokeWidth={1.75}
        className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
        onClick={() => setStartDate(incrementDate(startDate, steps))}
      />
    </div>
  )
}

function decrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() - steps))
}

function incrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() + steps))
}
