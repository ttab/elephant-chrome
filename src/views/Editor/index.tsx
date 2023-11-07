import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { ViewHeader } from '@/components'
import { withYjs, withYHistory, YjsEditor, withCursors } from '@slate-yjs/core'
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
      },
      onAwarenessUpdate: ({ states }) => {
        console.log(states)
      }
    })
  }, [documentId, hocuspocusWebsocket, jwt?.accessToken, viewId])

  // Create YjsEditor for Textbit to use
  const editor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          provider.document.get('content', Y.XmlText) as Y.XmlText
        ),
        provider?.awareness,
        {
          data: cursorData(jwt?.sub_name || '')
        }
      )
    )
  }, [provider, jwt?.sub_name])

  // Connect Yjs to editor once
  useEffect(() => {
    if (editor) {
      YjsEditor.connect(editor)
      return () => YjsEditor.disconnect(editor)
    }
  })

  const views = [
    // @ts-expect-error FIXME: yjsEditor needs more refinement
    < TextbitEditor yjsEditor={editor} />,
    <strong className="animate-pulse">Not connected</strong>
  ]

  return (
    <>
      <ViewHeader title='Editor' />
      <main className="min-w-[70vw]">
        <div className="h-full relative">
          {views[connectionStatus === WebSocketStatus.Connected ? 0 : 1]}
        </div>
      </main>
    </>
  )
}

function cursorData(name: string): Record<string, unknown> {
  const colors = [
    'aquamarine',
    'beige',
    'blueviolet',
    'brown',
    'cadetblue',
    'burlywood',
    'chocoalate',
    'coral',
    'crimson',
    'hotpink',

    'lightcoral',
    'lightpink',
    'lightgreen',
    'lightgray',
    'lightcyan',
    'lightblue',
    'lightsalmon',
    'lightseagreen',
    'lightsteelblue',
    'lemonchiffon',
    'palegreen',
    'tomato'
  ]

  const [first, last] = name.split(' ')
  const f1 = first.substring(0, 1)
  const l1 = last.substring(0, 1)

  return {
    color: colors[Math.floor(Math.random() * colors.length)],
    initials: `${f1}${l1}`,
    name,
    avatar: ''
  }
}

Editor.displayName = 'Editor'
