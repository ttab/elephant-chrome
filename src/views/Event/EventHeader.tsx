import { useView, useYValue } from '@/hooks'
import { useEffect, useRef } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { Duplicate } from '@/components/Duplicate'
import type { Session } from 'next-auth'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { MetaSheet } from '../Editor/components/MetaSheet'
import type { EventData } from './components/EventTime'

export const EventHeader = ({
  documentId,
  asDialog,
  onDialogClose,
  provider,
  title,
  status,
  session,
  isChanged
}: {
  documentId: string
  asDialog: boolean
  onDialogClose?: () => void
  title: string | undefined
  session: Session | null
  provider: HocuspocusProvider | undefined
  status: 'authenticated' | 'loading' | 'unauthenticated'
  isChanged?: boolean
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)
  const [eventData] = useYValue<EventData | undefined>('meta.core/event[0].data')

  useEffect(() => {
    if (viewId) {
      containerRef.current = (document.getElementById(viewId))
    }
  }, [viewId])

  return (
    <ViewHeader.Root asDialog={asDialog}>
      <ViewHeader.Title
        name='Events'
        title={(!asDialog) ? 'Händelse' : 'Skapa ny händelse'}
        asDialog={asDialog}
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[850px] mx-auto flex flex-row gap-0 justify-between items-center w-full'>
          <div className='flex flex-row gap-0 justify-start items-center @6xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @xl/view:flex'>
              {/* No content as of now */}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && (
              <StatusMenu
                documentId={documentId}
                type='core/event'
                isChanged={isChanged}
              />
            )}

            {!!documentId && !asDialog && (
              <>
                <ViewHeader.RemoteUsers documentId={documentId} />
              </>
            )}
            {!asDialog && provider && eventData && (
              <Duplicate
                title={title}
                provider={provider}
                session={session}
                status={status}
                type='Event'
                dataInfo={eventData}
              />
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog}>
        {!asDialog && <MetaSheet container={containerRef.current} documentId={documentId} />}
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
