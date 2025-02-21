import { DateChanger } from '@/components/Header/Datechanger'
import { TableFilter } from '@/components'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo } from 'react'
import { GridFilter } from '../GridFilter'
import type { Facets } from '@/hooks/index/lib/assignments/filterAssignments'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import { createDocument } from '@/lib/createYItem'
import { getTemplate } from '@/defaults/templates/lib/getTemplate'

export const Header = ({ assigneeUserName, type, facets }: {
  type: View
  assigneeUserName?: string | undefined
  facets?: Facets
}): JSX.Element => {
  const showButton = useMemo(() => {
    const viewTypes: View[] = ['Planning', 'Event']
    if (viewTypes.includes(type)) {
      return true
    }
    return false
  }, [type])

  const { showModal, hideModal } = useModal()

  const Filter = type === 'Approvals' ? GridFilter : TableFilter
  const ViewDialog = Views[type]

  return (
    <>
      {showButton && (
        <Button
          size='sm'
          className='h-8 pr-4'
          onClick={() => {
            const initialDocument = createDocument({
              template: getTemplate(type),
              inProgress: true
            })
            showModal(
              <ViewDialog
                onDialogClose={hideModal}
                asDialog
                id={initialDocument[0]}
                document={initialDocument[1]}
              />
            )
          }}
        >
          <PlusIcon size={18} strokeWidth={1.75} />
          <span className='pl-0.5'>Ny</span>
        </Button>
      )}

      <div className='hidden sm:block'>
        <TabsGrid />
      </div>

      <DateChanger type={type} />
      <Filter facets={facets} />

      {type === 'Assignments' && <PersonalAssignmentsFilter assigneeUserName={assigneeUserName} />}
    </>
  )
}
