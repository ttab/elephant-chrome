import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { Link } from '@/components'
import { DatePicker } from '../Datepicker'
import {
  useEffect,
  useMemo
} from 'react'
import { useQuery, useView, useLink } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'

// FIXME: Implement handling of date intervals, commented out at the moment

export const DateChanger = (): JSX.Element => {
  const { isActive } = useView()
  const { startDate, endDate } = useQuery()
  const _startDate = useMemo(() => {
    console.log(startDate)
    return startDate
      ? new Date(startDate)
      : new Date()
  }, [startDate])

  const steps = endDate ? 7 : 1

  const changeDate = useLink('Plannings')

  useEffect(() => {
    const keyDownHandler = (evt: KeyboardEvent): void => {
      if (!isActive || isEditableTarget(evt)) {
        return
      }

      if (evt.key === 'ArrowLeft' && !evt.altKey) {
        evt.stopPropagation()
        changeDate(evt, { startDate: decrementDate(_startDate, steps) }, 'self')
      } else if (evt.key === 'ArrowRight' && !evt.altKey) {
        evt.stopPropagation()
        changeDate(evt, { startDate: incrementDate(_startDate, steps) }, 'self')
      }
    }

    document.addEventListener('keydown', keyDownHandler)
    return () => document.removeEventListener('keydown', keyDownHandler)
  }, [isActive, _startDate, steps, changeDate])

  return (
    <div className="flex items-center">
      <Link
        to='Plannings'
        props={{ startDate: decrementDate(_startDate, steps).toISOString().split('T')[0] }}
        target='self'>
        <ChevronLeft
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
      />
      </Link>

      <DatePicker date={_startDate} />

      {/* {!!endDate && !!setEndDate &&
        <DatePicker date={endDate} setDate={setEndDate} />
      } */}

      <Link
        to='Plannings'
        props={{ startDate: incrementDate(_startDate, steps).toISOString().split('T')[0] }}
        target='self'
      >
        <ChevronRight
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
          onClick={() => {
            console.log(incrementDate(_startDate, steps).toISOString().split('T')[0])
          }}
      />
      </Link>
    </div>
  )
}

function decrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() - steps))
}

function incrementDate(date: Date, steps: number): Date {
  return new Date(date.setDate(date.getDate() + steps))
}
