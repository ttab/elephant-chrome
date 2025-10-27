import { useView } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'

import { useEffect, useRef } from 'react'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { Duplicate } from '@/components/Duplicate'
import type { Session } from 'next-auth'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { MetaSheet } from '../Editor/components/MetaSheet'
import type { EventData } from './components/EventTime'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

export const EventHeader = ({
  ydoc,
  asDialog,
  onDialogClose,
  provider,
  title,
  status,
  session,
  isChanged
}: {
  ydoc: YDocument<Y.Map<unknown>>
  asDialog: boolean
  onDialogClose?: () => void
  title: string | undefined
  session: Session | null
  provider: HocuspocusProvider | null
  status: 'authenticated' | 'loading' | 'unauthenticated'
  isChanged?: boolean
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)
  const [eventData] = useYValue<EventData | undefined>(ydoc.ele, 'meta.core/event[0].data')

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
        <div className='max-w-[850px] mx-auto flex flex-row gap-0 justify-between items-center w-full'>
          <div className='flex flex-row gap-0 justify-start items-center @6xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @xl/view:flex'>
              {/* No content as of now */}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!asDialog && ydoc && (
              <StatusMenu
                documentId={ydoc.id}
                type='core/event'
                isChanged={isChanged}
              />
            )}

            {!!ydoc && !asDialog && (
              <>
                <ViewHeader.RemoteUsers ydoc={ydoc} />
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

      <ViewHeader.Action ydoc={ydoc} onDialogClose={onDialogClose} asDialog={asDialog}>
        {!asDialog && ydoc && (
          <MetaSheet container={containerRef.current} documentId={ydoc.id} />
        )}
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
