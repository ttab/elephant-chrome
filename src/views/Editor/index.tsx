import { ViewHeader } from '@/components'
import { useApi } from '@/hooks/useApi'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { PenLine } from '@ttab/elephant-ui/icons'
import { TextbitEditable } from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'
import { useEffect, useMemo, useState } from 'react'
import { createEditor } from 'slate'
import * as Y from 'yjs'

import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession, useQuery } from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'

const meta: ViewMetadata = {
  name: 'Editor',
  path: '/editor',
  widths: {
    sm: 12,
    md: 12,
    lg: 4,
    xl: 4,
    '2xl': 4
  }
}

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
      <ViewHeader
        {...props}
      >
        <div className='flex'>
          <PenLine className='w-4 h-4 mr-1 mt-2' />
          <h1 className='font-sans font-semibold text-md break-all mr-4 mt-1'>
            Editor
          </h1>
        </div>
      </ViewHeader>
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

Editor.meta = meta

export { Editor }
