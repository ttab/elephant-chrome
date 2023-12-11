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

export const DateChanger = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: DateChangerProps): JSX.Element => {
  const steps = !!endDate && !!setEndDate ? 7 : 1

  return (
    <>
      <ChevronLeft
        className='w-4 h-4 mt-2 ml-4'
        onClick={() => setStartDate(decrementDate(startDate, steps))}
      />

      <DatePicker date={startDate} setDate={setStartDate} />

      {!!endDate && !!setEndDate &&
        <DatePicker date={endDate} setDate={setEndDate} />
      }

      <ChevronRight
        className='w-4 h-4 mt-2'
        onClick={() => setStartDate(incrementDate(startDate, steps))}
      />
    </>
  )
}

function decrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() - steps))
}

function incrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() + steps))
}
