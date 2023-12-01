import { CalendarSearch } from '@ttab/elephant-ui/icons'
import { DateChanger } from './Datechanger'
import { TabsGrid } from './LayoutSwitch'
import { Filter } from './Filter'
import { type Dispatch, type SetStateAction } from 'react'

export interface PlanningHeaderProps {
  date: Date
  setDate: Dispatch<SetStateAction<Date>>
}
export const PlanningHeader = ({ date, setDate }: PlanningHeaderProps): JSX.Element => (
  <div className='flex'>
    <CalendarSearch className='w-4 h-4 mr-1 mt-2' />
    <h1
      className='font-sans font-semibold text-md break-all mr-4 mt-1'
    >
      Planning
    </h1>
    <TabsGrid />
    <DateChanger date={date} setDate={setDate} />
    <Filter />
  </div>
)
