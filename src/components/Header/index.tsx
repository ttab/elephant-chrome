import { DateChanger } from '@/components/Header/Datechanger'
import { Filter } from '@/components'
import { CreateDocumentDialog } from '@/components/View/ViewHeader/CreateDocumentDialog'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { type View } from '@/types/index'
import { Commands } from '../Commands'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'

export const Header = ({ tab, assigneeUserName, type }: {
  tab: string
  type: View
  assigneeUserName?: string | undefined
}): JSX.Element => {
  return (
    <>
      <CreateDocumentDialog type={type}>
        <Button size='sm' className='h-8 pr-4'>
          <PlusIcon size={18} strokeWidth={1.75} />
          {' '}
          Ny
        </Button>
      </CreateDocumentDialog>

      <div className='hidden sm:block'>
        <TabsGrid />
      </div>

      {tab === 'list'
      && <DateChanger type={type} />}

      {tab === 'grid'
      && <DateChanger type={type} />}

      <Filter>
        <Commands />
      </Filter>
      {type === 'Assignments' && <PersonalAssignmentsFilter assigneeUserName={assigneeUserName} />}
    </>
  )
}
