import { DateChanger } from '@/components/Header/Datechanger'
import { Filter } from './Filter'
import {
  type Dispatch,
  type SetStateAction
} from 'react'
import { CreatePlanning } from './CreatePlanning'
import { TabsGrid } from '@/components/Header/LayoutSwitch'

export const Header = ({ tab, startDate, setStartDate, endDate, setEndDate }: {
  tab: string
  startDate: Date
  setStartDate: Dispatch<SetStateAction<Date>>
  endDate?: Date
  setEndDate?: Dispatch<SetStateAction<Date>>
}): JSX.Element => {
  return <>
    <CreatePlanning />

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
