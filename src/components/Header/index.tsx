import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo, type JSX } from 'react'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'

export const Header = ({ assigneeId, type }: {
  type: View
  assigneeId?: string | undefined
}): JSX.Element => {
  const showButton = useMemo(() => {
    const viewTypes: View[] = ['Planning', 'Event', 'Factbox']
    if (viewTypes.includes(type)) {
      return true
    }
    return false
  }, [type])

  const { showModal, hideModal } = useModal()

  const ViewDialog = Views[type]

  return (
    <>
      {showButton && (
        <Button
          size='sm'
          className='h-8 pr-4'
          onClick={() => {
            const id = crypto.randomUUID()
            const initialDocument = getTemplateFromView(type)(id)
            showModal(
              <ViewDialog
                onDialogClose={hideModal}
                asDialog
                id={id}
                document={initialDocument}
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

      {type === 'Assignments'
        && <PersonalAssignmentsFilter assigneeId={assigneeId} />}
    </>
  )
}
