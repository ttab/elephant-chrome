import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useEffect, useRef } from 'react'
import { DocumentStatus } from '@/components/TmpDocumentStatus'
import { ViewHeader } from '@/components/View'

export const EventHeader = ({ documentId, asDialog }: {
  documentId: string
  asDialog: boolean
}): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])


  return (
    <ViewHeader.Root>
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
            {!!documentId && <ViewHeader.RemoteUsers documentId={documentId} />}
            <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action />
    </ViewHeader.Root>
  )
}
