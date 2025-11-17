import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { Button } from '@ttab/elephant-ui'
import { PlusIcon } from '@ttab/elephant-ui/icons'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo } from 'react'
import { useModal } from '../Modal/useModal'
import * as Views from '@/views'
import { createDocument } from '@/shared/createYItem'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { getConceptTemplateFromDocumentType } from '@/shared/templates/lib/getConceptTemplateFromDocumentType'

export const Header = ({ assigneeId, type, documentType }: {
  type: View
  assigneeId?: string | undefined
  documentType?: string
}): JSX.Element => {
  const showButton = useMemo(() => {
    const viewTypes: View[] = ['Planning', 'Event', 'Factbox', 'Concept']
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
            const initialDocument = createDocument({
              template: type === 'Concept' ? getConceptTemplateFromDocumentType(documentType) : getTemplateFromView(type),
              inProgress: true
            })
            showModal(
              <ViewDialog
                onDialogClose={hideModal}
                asDialog
                id={initialDocument[0]}
                document={initialDocument[1]}
                documentType={documentType}
              />
            )
          }}
        >
          <PlusIcon size={18} strokeWidth={1.75} />
          <span className='pl-0.5'>Ny</span>
        </Button>
      )}

      {type === 'Concept'
        && (
          <>
            <div className='hidden sm:block'>
              <TabsGrid />
            </div>

            <DateChanger type={type} />
          </>
        )}
      {type === 'Assignments'
        && <PersonalAssignmentsFilter assigneeId={assigneeId} />}
    </>
  )
}
