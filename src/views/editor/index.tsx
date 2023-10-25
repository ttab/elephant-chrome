// import { useWebSocket } from '@/hooks/useWebSocket'
import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { withYjs, withYHistory, YjsEditor } from '@slate-yjs/core'
import { withReact } from 'slate-react'
import * as Y from 'yjs'
import { createEditor } from 'slate'

// import { Textbit, useTextbitEditor, type TextbitDescendant } from '@ttab/textbit'
import { Editor as TextbitEditor, type TextbitDescendant } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from '@hocuspocus/provider'
// import { createEditor, isEditor, Editor as SlateEditor } from 'slate'

export const Editor = (): JSX.Element => {
  const api = useApi()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [documentUuid, setDocumentUuid] = useState('7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe')

  const [value, setValue] = useState<TextbitDescendant[]>([])

  const provider = useMemo(() => {
    const endpoint = `ws://${api.endpoint}/`.replace('api', 'collaboration') // Seems to be correct!
    console.log(`Hocuspocus provider on ${endpoint}`)

    const hpWs = new HocuspocusProviderWebsocket({ url: endpoint })

    return new HocuspocusProvider({
      websocketProvider: hpWs,
      name: documentUuid,
      token: 'danne',
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

  const editor = useMemo(() => {
    const sharedType = provider.document.get('content', Y.XmlText)
    const e = withReact(
      withYHistory(
        withYjs(
          createEditor(), sharedType as Y.XmlText
        )
      )
    )
    return e
  }, [provider.document])

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
            ? (<TextbitEditor
              value={value}
              onChange={setValue}
              editor={editor}
            />)
            : <strong className="animate-pulse">Not connected</strong>
          }
        </div>
      </main>
    </div>
  )
}
