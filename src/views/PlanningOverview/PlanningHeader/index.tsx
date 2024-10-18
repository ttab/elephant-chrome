import { DateChanger } from '@/components/Header/Datechanger'
import { Filter } from '@/components'
import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { Commands } from '@/components/Commands'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'

export const Header = ({ tab }: {
  tab: string
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
      <DateChanger type='Plannings' />
    }

    {tab === 'grid' &&
      <DateChanger type='Plannings' />
    }

    <Filter>
      <Commands />
    </Filter>
  </>
}
