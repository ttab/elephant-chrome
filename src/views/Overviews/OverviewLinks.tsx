import { Link } from '@/components/index'
import { overviews } from '@/defaults/overviews'
import { SheetClose } from '@ttab/elephant-ui'
import { CalendarDaysIcon, CalendarPlus2 } from '@ttab/elephant-ui/icons'

export const OverviewLinks = (): JSX.Element[] => {
  return overviews.map(overview => {
    return (
      <SheetClose asChild key={overview.name}>
        <Link to={overview.name} className='flex gap-3 items-center px-3 py-2 rounded-md  hover:bg-gray-100'>
          <div className='flex items-center justify-center opacity-80 pr-2'>
            {overview.name === 'CalendarOverview' ? <CalendarPlus2 strokeWidth={1.75} size={18} /> : <CalendarDaysIcon strokeWidth={1.75} size={18} />}
          </div>
          <div>{overview.label}</div>
        </Link>
      </SheetClose>
    )
  })
}
