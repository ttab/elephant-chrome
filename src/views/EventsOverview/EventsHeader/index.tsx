import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import {
  type Dispatch,
  type SetStateAction
} from 'react'
import { Filter } from '@/components'
import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { EventsCommands } from '../EventsCommands'
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
    <CreateDocumentDialog type='Event'>
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
      <EventsCommands />
    </Filter>
  </>
}
