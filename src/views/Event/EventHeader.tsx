import { useDocumentStatus, useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { DocumentStatus } from '@/components/TmpDocumentStatus'
import { ViewHeader } from '@/components/View'
import { Duplicate } from '@/components/Duplicate'
import type { Session } from 'next-auth'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export const EventHeader = ({ documentId, asDialog, onDialogClose, provider, title, status, session, type }: {
  documentId: string
  asDialog: boolean
  onDialogClose?: () => void
  title: string | undefined
  session: Session | null
  provider: HocuspocusProvider | undefined
  type: 'event'
  status: 'authenticated' | 'loading' | 'unauthenticated'
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
                <DocumentStatus status={documentStatus} setStatus={setDocumentStatus} />
              </>
            )}
            {!asDialog && provider && (
              <Duplicate
                title={title}
                provider={provider}
                session={session}
                status={status}
                type={type}
              />
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} />
    </ViewHeader.Root>
  )
}
