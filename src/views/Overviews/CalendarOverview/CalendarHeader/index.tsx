import { DateChanger } from './Datechanger'
import { TabsGrid } from './LayoutSwitch'
import { Filter } from './Filter'
import {
  type Dispatch,
  type SetStateAction
} from 'react'
import { CreatePlan } from './CreatePlan'

export const CalendarHeader = ({ tab, startDate, setStartDate, endDate, setEndDate }: {
  tab: string
  startDate: Date
  setStartDate: Dispatch<SetStateAction<Date>>
  endDate?: Date
  setEndDate?: Dispatch<SetStateAction<Date>>
}): JSX.Element => {
  return <>
    <CreatePlan />

    <div className='hidden sm:block'>
      <TabsGrid />
    </div>

    {tab === 'list' &&
      <DateChanger startDate={startDate} setStartDate={setStartDate} />
    }

    {tab === 'grid' &&
      <DateChanger
        startDate={startDate} setStartDate={setStartDate}
        endDate={endDate} setEndDate={setEndDate}
      />
    }

    <Filter />
  </>
}
