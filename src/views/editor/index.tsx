import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { withYjs, withYHistory, YjsEditor } from '@slate-yjs/core'
import * as Y from 'yjs'
import { createEditor } from 'slate'

import { Editor as TextbitEditor } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from '@hocuspocus/provider'

export const Editor = (): JSX.Element => {
  const api = useApi()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [documentUuid, setDocumentUuid] = useState('7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe')

  const provider = useMemo(() => {
    const endpoint = `ws://${api.endpoint}/`.replace('api', 'collaboration')
    const hpWs = new HocuspocusProviderWebsocket({ url: endpoint })

    return new HocuspocusProvider({
      websocketProvider: hpWs,
      name: documentUuid,
      token: 'xyz-dummy-token',
      onAuthenticationFailed: ({ reason }) => {
        console.warn(reason)
      },
      onAuthenticated: () => {
        console.warn('Authenticated')
      },
      onSynced: ({ state }) => {
        if (state) {
          console.log('Connected')
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
  }, [documentUuid, api.endpoint])

  // Create YjsEditor for Textbit to use
  const editor = useMemo(() => {
    return withYHistory(
      withYjs(
        createEditor(),
        provider.document.get('content', Y.XmlText) as Y.XmlText // sharedType as Y.XmlText
      )
    )
  }, [provider.document])

  // Connect Yjs to editor once
  useEffect(() => {
    YjsEditor.connect(editor)
    return () => YjsEditor.disconnect(editor)
  })

  return (
    <div className="p-4">
      <header>
        <h1 className="strong text-xl font-bold">Editor header</h1>
      </header>

      <main className="mt-5 p-2 border shadow h-[800px]">
        <div className="h-full relative">
          {connectionStatus === WebSocketStatus.Connected
            ? (<TextbitEditor yjsEditor={editor} />) // FIXME: Types...
            : <strong className="animate-pulse">Not connected</strong>
          }
        </div>
      </main>
    </div>
  )
}
