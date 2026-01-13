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
import { useQuery } from '@/hooks/useQuery'
import { getConceptTemplateFromDocumentType } from '@/shared/templates/lib/getConceptTemplateFromDocumentType'

export const Header = ({ assigneeId, type, documentType }: {
  type: View
  assigneeId?: string | undefined
  documentType?: string
}): JSX.Element => {
  const [query] = useQuery()
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
            const id = crypto.randomUUID()
            const initialDocument = type === 'Concept' ? getConceptTemplateFromDocumentType(documentType) : getTemplateFromView(type)(id, { query })
            showModal(
              <ViewDialog
                onDialogClose={hideModal}
                asDialog
                id={id}
                document={initialDocument}
                documentType={documentType}
              />
            )
          }}
        >
          <PlusIcon size={18} strokeWidth={1.75} />
          <span className='pl-0.5'>Ny</span>
        </Button>
      )}

      {type !== 'Concept'
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
