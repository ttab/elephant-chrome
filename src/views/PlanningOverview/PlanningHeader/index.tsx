import { DateChanger } from './Datechanger'
import { TabsGrid } from './LayoutSwitch'
import { Filter } from './Filter'
import {
  type Dispatch,
  type SetStateAction
} from 'react'
import { Button } from '@ttab/elephant-ui'
import { Link } from '@/components'

export interface PlanningHeaderProps {
  tab: string
  startDate: Date
  setStartDate: Dispatch<SetStateAction<Date>>
  endDate?: Date
  setEndDate?: Dispatch<SetStateAction<Date>>
}

export const PlanningHeader = ({ tab, startDate, setStartDate, endDate, setEndDate }: PlanningHeaderProps): JSX.Element => {
  return <>
    <div className='hidden sm:block'>
      <TabsGrid />
    </div>

    {tab === 'list' &&
      <DateChanger startDate={startDate} setStartDate={setStartDate} />}

    {tab === 'grid' &&
      <DateChanger
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate} />}

    <Filter />

    <Button variant="ghost">
      <Link to='Planning' props={{ id: '' }}>+</Link>
    </Button>

  </>
}
