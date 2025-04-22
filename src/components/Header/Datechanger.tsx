import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { Link } from '@/components'
import { DatePicker } from '../Datepicker'
import { useMemo } from 'react'
import { useQuery, useLink } from '@/hooks'
import { addDays, subDays } from 'date-fns'
import { type View } from '@/types/index'

export const DateChanger = ({ type, keepQuery }: {
  type: View
  keepQuery?: boolean
}): JSX.Element | undefined => {
  const [{ from, to }] = useQuery()

  const currentDate = useMemo(() => {
    return typeof from === 'string'
      ? new Date(from)
      : new Date()
  }, [from])

  const steps = to ? 7 : 1

  const validViews: View[] = ['Plannings', 'Events', 'Assignments', 'Approvals', 'Search']
  const linkTarget = validViews.find((view) => view.startsWith(type))
  const [query] = useQuery()

  const changeDate = useLink(linkTarget || type)

  if (!linkTarget) {
    return
  }

  return (
    <div className='flex items-center'>
      {linkTarget !== 'Search' && (
        <Link
          to={linkTarget}
          props={{ ...query, from: decrementDate(currentDate, steps).toISOString().split('T')[0] }}
          target='self'
        >
          <ChevronLeft
            strokeWidth={1.75}
            className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
          />
        </Link>
      )}

      <DatePicker date={currentDate} changeDate={changeDate} keepQuery={keepQuery ? query : undefined} />

      {linkTarget !== 'Search' && (
        <Link
          to={linkTarget}
          props={{ ...query, from: incrementDate(currentDate, steps).toISOString().split('T')[0] }}
          target='self'
        >
          <ChevronRight
            strokeWidth={1.75}
            className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
          />
        </Link>
      )}
    </div>
  )
}

function decrementDate(date: Date, steps: number): Date {
  return subDays(date, steps)
}

function incrementDate(date: Date, steps: number): Date {
  return addDays(date, steps)
}
