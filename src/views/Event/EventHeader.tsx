import { useDocumentStatus, useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { DocumentStatus } from '@/components/DocumentStatus'
import { ViewHeader } from '@/components/View'

export const EventHeader = ({ documentId, asDialog, onDialogClose }: {
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
        name='Events'
        title={(!asDialog) ? 'Händelse' : 'Skapa ny händelse'}
        asDialog={asDialog}
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[850px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @6xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @xl/view:flex'>
              {/* No content as of now */}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && !asDialog && (
              <>
                <ViewHeader.RemoteUsers documentId={documentId} />
                <DocumentStatus type='core/event' status={documentStatus} setStatus={setDocumentStatus} />
              </>
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} />
    </ViewHeader.Root>
  )
}
