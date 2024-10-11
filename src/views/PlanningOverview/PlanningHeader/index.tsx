import { DateChanger } from '@/components/Header/Datechanger'
import { Filter } from '@/components'
import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { PlanningCommands } from '../PlanningCommands'

export const Header = ({ tab }: {
  tab: string
}): JSX.Element => {
  return <>
    <CreateDocumentDialog type='Planning' />

    <div className='hidden sm:block'>
      <TabsGrid />
    </div>

    {tab === 'list' &&
      <DateChanger />
    }

    {tab === 'grid' &&
      <DateChanger
      />
    }

    <Filter>
      <PlanningCommands />
    </Filter>
  </>
}
