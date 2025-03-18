import { useDocumentStatus, useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { DocumentStatusMenu } from '@/components/DocumentStatusMenu'
import { ViewHeader } from '@/components/View'
import { BookTextIcon } from '@ttab/elephant-ui/icons'

export const FactboxHeader = ({ documentId, asDialog, onDialogClose }: {
  documentId: string
  asDialog: boolean
  onDialogClose?: () => void
}): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Factbox'
        title='Faktaruta'
        icon={BookTextIcon}
        asDialog={asDialog}
      />
      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[780px] mx-auto flex flex-row gap-1 justify-between items-center w-full'>
          <div className='flex flex-row gap-2 justify-start items-center @6xl/view:-ml-20'>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && (
              <DocumentStatusMenu type='core/planning-item' status={documentStatus} setStatus={setDocumentStatus} />
            )}

            {!!documentId && <ViewHeader.RemoteUsers documentId={documentId} />}
          </div>
        </div>
      </ViewHeader.Content>
      <ViewHeader.Action onDialogClose={onDialogClose} />

    </ViewHeader.Root>
  )
}
