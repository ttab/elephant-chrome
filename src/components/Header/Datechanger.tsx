import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { Link } from '@/components'
import { DatePicker } from '../Datepicker'
import {
  useEffect,
  useMemo
} from 'react'
import { useQuery, useView, useLink } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'
import { addDays, subDays } from 'date-fns'
import { type View } from '@/types/index'

export const DateChanger = ({ type }: {
  type: View
}): JSX.Element => {
  const { isActive } = useView()
  const { from, to } = useQuery()

  const currentDate = useMemo(() => {
    return from
      ? new Date(from)
      : new Date()
  }, [from])

  const steps = to ? 7 : 1

  const changeDate = useLink(type)

  useEffect(() => {
    const keyDownHandler = (evt: KeyboardEvent): void => {
      if (!isActive || isEditableTarget(evt)) {
        return
      }

      if (evt.key === 'ArrowLeft' && !evt.altKey) {
        evt.stopPropagation()
        changeDate(evt,
          {
            from: decrementDate(currentDate, steps)
              .toISOString()
              .split('T')[0]
          },
          'self')
      } else if (evt.key === 'ArrowRight' && !evt.altKey) {
        evt.stopPropagation()
        changeDate(evt,
          {
            from: incrementDate(currentDate, steps)
              .toISOString()
              .split('T')[0]
          },
          'self')
      }
    }

    document.addEventListener('keydown', keyDownHandler)
    return () => document.removeEventListener('keydown', keyDownHandler)
  }, [isActive, currentDate, steps, changeDate])

  return (
    <div className="flex items-center">
      <Link
        to={type}
        props={{ from: decrementDate(currentDate, steps).toISOString().split('T')[0] }}
        target='self'
      >
        <ChevronLeft
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
      />
      </Link>

      <DatePicker date={currentDate} changeDate={changeDate} />

      <Link
        to={type}
        props={{ from: incrementDate(currentDate, steps).toISOString().split('T')[0] }}
        target='self'
      >
        <ChevronRight
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
      />
      </Link>
    </div>
  )
}

function decrementDate(date: Date, steps: number): Date {
  return subDays(date, steps)
}

function incrementDate(date: Date, steps: number): Date {
  return addDays(date, steps)
}
