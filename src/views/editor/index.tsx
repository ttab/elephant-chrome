// import { useWebSocket } from '@/hooks/useWebSocket'
import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { withYjs, withYHistory, YjsEditor } from '@slate-yjs/core'
import { withReact } from 'slate-react'
import * as Y from 'yjs'
import { Textbit, useTextbitEditor, type TextbitDescendant } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from '@hocuspocus/provider'
import { createEditor } from 'slate'

export const Editor = (): JSX.Element => {
  const api = useApi()
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const [documentUuid, setDocumentUuid] = useState('7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe')

  const [value, setValue] = useState<TextbitDescendant[]>([ // ])
    {
      type: 'core/text',
      id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
      class: 'text',
      children: [
        { text: '' }
      ]
    }
  ])

  const provider = useMemo(() => {
    const endpoint = `ws://${api.endpoint}/`.replace('api', 'collaboration') // Seems to be correct!
    console.log(`Hocuspocus provider on ${endpoint}`)

    const hpWs = new HocuspocusProviderWebsocket({ url: endpoint })

    return new HocuspocusProvider({
      websocketProvider: hpWs,
      name: documentUuid,
      token: 'danne',
      onConnect: () => {
        console.log('IS CONNECTED')
      },
      onDisconnect: () => {
        console.log('DISCONNECTED')
      },
      onOpen: () => {
        console.log('IS OPEN')
      },
      onClose: () => {
        console.log('IS CLOSED')
      },
      onSynced: ({ state }) => {
        console.log(state)
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

  // const editor: YjsEditorType = useTextbitEditor((editor) => {
  //   const sharedType = provider.document.get('content', Y.XmlText)
  //   withYjs(editor, sharedType as Y.XmlText)
  //   withYHistory(editor)

  //   return editor
  // })

  useEffect(() => {
    console.log('CONNECTING')
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
            ? (<Textbit
              value={value}
              onChange={setValue}
              editor={editor}
            />)
            : <strong>Not connected</strong>
          }
        </div>
      </main>
    </div>
  )
}
