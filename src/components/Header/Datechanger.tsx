import { ChevronLeftIcon, ChevronRightIcon } from '@ttab/elephant-ui/icons'
import { Link } from '@/components'
import { DatePicker } from '../Datepicker'
import { useQuery, useLink } from '@/hooks'
import { addDays, subDays, format } from 'date-fns'
import { parseDate } from '@/shared/datetime'
import { type View } from '@/types/index'
import { useMemo, type JSX } from 'react'

// Only these views are valid targets for date changes
const validViews: View[] = ['Plannings', 'Events', 'Assignments', 'Approvals', 'Print']

export const DateChanger = ({ type }: { type: View }): JSX.Element | null => {
  const [query] = useQuery()
  const { from, to } = query

  const linkTarget = validViews.find((view: View) => view.startsWith(type))

  const currentDate = useMemo(() => {
    if (typeof from === 'string') {
      return parseDate(from) ?? new Date()
    }
    return new Date()
  }, [from])

  const steps = to ? 7 : 1

  const changeDate = useLink(linkTarget || type)

  const getDateString = (date: Date) => format(date, 'yyyy-MM-dd')

  const getLinkProps = (fn: (currentDate: Date, steps: number) => Date) => {
    const date = fn(currentDate, steps)

    return { ...query, from: getDateString(date) }
  }

  if (!linkTarget) {
    return null
  }

  return (
    <div className='flex items-center'>
      <Link
        to={linkTarget}
        props={getLinkProps(subDays)}
        target='self'
        className='hidden @md/view:flex'
      >
        <ChevronLeftIcon
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
        />
      </Link>

      <DatePicker date={currentDate} changeDate={changeDate} />

      <Link
        to={linkTarget}
        props={getLinkProps(addDays)}
        target='self'
        className='hidden @md/view:flex'
      >
        <ChevronRightIcon
          strokeWidth={1.75}
          className='w-6 h-8 px-1 py-2 rounded cursor-pointer hover:bg-muted'
        />
      </Link>
    </div>
  )
}
