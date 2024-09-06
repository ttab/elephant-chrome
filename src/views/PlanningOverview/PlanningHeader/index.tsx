import { DateChanger } from '@/components/Header/Datechanger'
import { Filter } from '@/components'
import {
  type Dispatch,
  type SetStateAction
} from 'react'
import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { PlanningCommands } from '../PlanningCommands'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'

export const Header = ({ tab, startDate, setStartDate, endDate, setEndDate }: {
  tab: string
  startDate: Date
  setStartDate: Dispatch<SetStateAction<Date>>
  endDate?: Date
  setEndDate?: Dispatch<SetStateAction<Date>>
}): JSX.Element => {
  return <>
    <CreateDocumentDialog type='Planning'>
      <Button size='sm' className='h-8 pr-4'>
        <PlusIcon size={18} strokeWidth={1.75} /> Ny
      </Button>
    </CreateDocumentDialog>

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

    <Filter>
      <PlanningCommands />
    </Filter>
  </>
}
