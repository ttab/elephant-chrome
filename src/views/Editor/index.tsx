import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { withYjs, withYHistory, YjsEditor } from '@slate-yjs/core'
import * as Y from 'yjs'
import { createEditor } from 'slate'

import { Editor as TextbitEditor } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import { useSession } from '@/hooks'
import { type ViewProps } from '@/types'

export const Editor = (props: ViewProps): JSX.Element => {
  const [jwt] = useSession()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [documentId] = useState('7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe')
  const { id: viewId } = props
  const { hocuspocusWebsocket } = useApi()

  const provider = useMemo(() => {
    if (!hocuspocusWebsocket) {
      return
    }

    if (!jwt?.accessToken) {
      return
    }

    /* FIXME: using shared hocus pocus websocket provider
     * It might be that using the provided shared "hocuspocusWebsocket" does not work as it might not
     * be possible to have the same document synced twice to the same hocuspocusprovider in the client?
     */
    return new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
      token: jwt.accessToken as string,
      onAuthenticationFailed: ({ reason }) => {
        console.warn(reason)
      },
      onAuthenticated: () => {
        console.info('Authenticated', viewId)
      },
      onSynced: ({ state }) => {
        if (state) {
          console.info('Synced ', viewId)
          setConnectionStatus(WebSocketStatus.Connected)
        }
      },
      onStatus: ({ status }) => {
        if (status === 'disconnected') {
          console.warn('Lost connection', viewId)
          setConnectionStatus(WebSocketStatus.Disconnected)
        }
      }
      // TODO: Implement awareness
      // onAwarenessUpdate: ({ states }) => {
      //   console.log(states)
      // }
    })
  }, [documentId, hocuspocusWebsocket, jwt?.accessToken, viewId])

  // Create YjsEditor for Textbit to use
  const editor = useMemo(() => {
    if (!provider) {
      return
    }

    return withYHistory(
      withYjs(
        createEditor(),
        provider.document.get('content', Y.XmlText) as Y.XmlText // sharedType as Y.XmlText
      )
    )
  }, [provider])

  // Connect Yjs to editor once
  useEffect(() => {
    if (editor) {
      YjsEditor.connect(editor)
      return () => YjsEditor.disconnect(editor)
    }
  })

  const views = [
    // @ts-expect-error FIXME: yjsEditor needs more refinement
    <TextbitEditor yjsEditor={editor} />,
    <strong className="animate-pulse">Not connected</strong>
  ]

  return (
    <div className="p-4 w-[800px]">
      <header>
        <h1 className="strong text-xl font-bold">Editor header</h1>
      </header>

      <main className="mt-5 p-2">
        <div className="h-full relative">
          {views[connectionStatus === WebSocketStatus.Connected ? 0 : 1]}
          {/*
          {connectionStatus === WebSocketStatus.Connected && editor ? (<TextbitEditor yjsEditor={editor} />) : <strong className="animate-pulse">Not connected</strong>}
          */}
        </div>
      </main>
    </div>
  )
}

Editor.displayName = 'Editor'
