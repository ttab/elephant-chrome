import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { withYjs, withYHistory, YjsEditor } from '@slate-yjs/core'
import * as Y from 'yjs'
import { createEditor } from 'slate'

import { Editor as TextbitEditor } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from '@hocuspocus/provider'
import { useSession } from '@/hooks'

export const Editor = (props: Record<string, string>): JSX.Element => {
  const [jwt] = useSession()
  const { websocketUrl, hocuspocusWebsocket } = useApi()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [documentId, setDocumentId] = useState('7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe')
  const { index: viewIndex } = props

  const provider = useMemo(() => {
    const hpWs = new HocuspocusProviderWebsocket({ url: websocketUrl })

    if (!jwt?.accessToken) {
      return
    }

    /* FIXME: using shared hocus pocus websocket provider
     * It might be that using the provided shared "hocuspocusWebsocket" does not work as it might not
     * be possible to have the same document synced twice to the same hocuspocusprovider in the client?
     */
    return new HocuspocusProvider({
      websocketProvider: hpWs, // hocuspocusWebsocket, // FIXME: Is the problem having same uuid (name below) on same shared hp websocket?
      name: documentId,
      token: jwt.accessToken as string,
      onAuthenticationFailed: ({ reason }) => {
        console.warn(reason)
      },
      onAuthenticated: () => {
        console.info('Authenticated')
      },
      onSynced: ({ state }) => {
        if (state) {
          console.info('Connected')
          setConnectionStatus(WebSocketStatus.Connected)
        }
      },
      onStatus: ({ status }) => {
        if (status === 'disconnected') {
          console.warn('Lost connection')
          setConnectionStatus(WebSocketStatus.Disconnected)
        }
      }
    })
  }, [documentId])

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

  return (
    <div className="p-4">
      <header>
        <h1 className="strong text-xl font-bold">Editor header</h1>
      </header>

      <main className="mt-5 p-2 border shadow h-[800px]">
        <div className="h-full relative">
          {connectionStatus === WebSocketStatus.Connected && editor
            ? (<TextbitEditor yjsEditor={editor} />) // FIXME: Types...
            : <strong className="animate-pulse">Not connected</strong>
          }
        </div>
      </main>
    </div>
  )
}

Editor.displayName = 'Editor'
