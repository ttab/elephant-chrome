import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { DatePicker } from './Datepicker'
import {
  type Dispatch,
  type SetStateAction
} from 'react'

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
  const steps = !!endDate && !!setEndDate ? 7 : 1

  return (
    <div className="flex items-center">
      <ChevronLeft
        className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
        onClick={() => setStartDate(decrementDate(startDate, steps))}
      />

      <DatePicker date={startDate} setDate={setStartDate} />

      {/* {!!endDate && !!setEndDate &&
        <DatePicker date={endDate} setDate={setEndDate} />
      } */}

      <ChevronRight
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
