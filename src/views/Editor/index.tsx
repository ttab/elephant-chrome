import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { ViewHeader } from '@/components'
import { withYjs, withYHistory, YjsEditor, withCursors } from '@slate-yjs/core'
import * as Y from 'yjs'
import { createEditor } from 'slate'

import { Editor as TextbitEditor } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider, WebSocketStatus } from '@hocuspocus/provider'
import { useSession, useQuery } from '@/hooks'
import { type ViewProps } from '@/types'

export const Editor = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const { jwt } = useSession()
  const { hocuspocusWebsocket } = useApi()

  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>(WebSocketStatus.Disconnected)
  const documentId = props.documentId || query.documentId

  const provider = useMemo(() => {
    if (!hocuspocusWebsocket) {
      return
    }

    if (!jwt?.access_token) {
      return
    }

    if (!documentId) {
      return
    }

    /* FIXME: using shared hocus pocus websocket provider
     * It might be that using the provided shared "hocuspocusWebsocket" does not work as it might not
     * be possible to have the same document synced twice to the same hocuspocusprovider in the client?
     */
    return new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
      token: jwt.access_token,
      onAuthenticationFailed: ({ reason }) => {
        console.warn(reason)
      },
      onAuthenticated: () => {
        console.info('Authenticated', documentId)
      },
      onSynced: ({ state }) => {
        if (state) {
          console.info('Synced ', documentId)
          setConnectionStatus(WebSocketStatus.Connected)
        }
      },
      onStatus: ({ status }) => {
        if (status === 'disconnected') {
          console.warn('Lost connection', documentId)
          setConnectionStatus(WebSocketStatus.Disconnected)
        }
      }
      // FIXME: This is needed later when we want to show info on active users in views
      // onAwarenessUpdate: ({ states }) => {
      //   console.log(states)
      // }
    })
  }, [documentId, hocuspocusWebsocket, jwt?.access_token])

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
      <ViewHeader title='Editor' {...props} />
      <main className="min-w-[30vw]">
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
