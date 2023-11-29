import { useApi } from '@/hooks/useApi'
import { useEffect, useMemo, useState } from 'react'
import { ViewHeader } from '@/components'
import { withYjs, withYHistory, YjsEditor, withCursors } from '@slate-yjs/core'
import * as Y from 'yjs'
import { createEditor } from 'slate'

import { TextbitEditable } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'

import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession, useQuery } from '@/hooks'
import { type ViewProps } from '@/types'

const Editor = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const { jwt } = useSession()
  const { hocuspocusWebsocket } = useApi()

  const [isSynced, setIsSynced] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // Ensure we have a valid document id
  const documentId = useMemo(() => {
    return props.documentId || query.documentId
  }, [props.documentId, query.documentId])


  // Setup hocus pocus provider
  const provider = useMemo(() => {
    if (!hocuspocusWebsocket || !jwt?.access_token || !documentId) {
      return
    }

    return new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
      token: jwt.access_token,
      onConnect: () => {
        setIsConnected(true)
      },
      onSynced: () => {
        setIsSynced(true)
      },
      onDisconnect: () => {
        setIsSynced(false)
        setIsConnected(false)
      }
    })
  }, [documentId, hocuspocusWebsocket, jwt?.access_token])


  // Create YjsEditor for Textbit to use
  const editor = useMemo(() => {
    if (!jwt?.sub_name || !provider?.awareness) {
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


  // Connect/disconnect from provider through editor only when editor changes
  useEffect(() => {
    if (editor) {
      YjsEditor.connect(editor)
      return () => YjsEditor.disconnect(editor)
    }
  }, [editor])

  return (
    <>
      <ViewHeader title='Editor' {...props} />
      <main className="min-w-[30vw]">
        <div className={`h-full relative ${!isConnected || !isSynced ? 'opacity-60' : ''}`}>
          { /* @ts-expect-error yjsEditor needs more refinement */}
          <TextbitEditable yjsEditor={editor} />
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

Editor.meta = {
  name: 'Editor',
  path: '/editor',
  widths: {
    sm: [100],
    md: [100],
    lg: [50, 100],
    xl: [50, 100],
    '2xl': [20, 40]
  }
}

export { Editor }
