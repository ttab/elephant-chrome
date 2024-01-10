import { ViewHeader } from '@/components'
import { useApi } from '@/hooks/useApi'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import {
  TextbitEditable,
  Textbit,
  useTextbitContext
} from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'
import { useEffect, useMemo, useState } from 'react'
import { createEditor } from 'slate'
import * as Y from 'yjs'

import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession, useQuery } from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { Toolbar } from './Toolbar'

const meta: ViewMetadata = {
  name: 'Editor',
  path: `${import.meta.env.BASE_URL || ''}/editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 4
  }
}

const Editor = (props: ViewProps): JSX.Element => {
  const query = useQuery()
  const { jwt } = useSession()
  const { hocuspocusWebsocket } = useApi()
  const [isSynced, setIsSynced] = useState<boolean>(false)

  // Ensure we have a valid document id
  const documentId = useMemo(() => {
    return props.documentId || query.documentId
  }, [props.documentId, query.documentId])


  // Setup hocus pocus provider
  const provider = useMemo(() => {
    if (!hocuspocusWebsocket || !jwt?.access_token || !documentId) {
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
      token: jwt.access_token,
      onSynced: () => {
        setIsSynced(true)
      },
      onDisconnect: () => {
        setIsSynced(false)
      }
    })

    return provider
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
        provider.awareness,
        { data: cursorData(jwt?.sub_name || '') }
      )
    )
  }, [jwt?.sub_name, provider?.awareness, provider?.document])


  // Connect/disconnect from provider through editor only when editor changes
  useEffect(() => {
    if (editor) {
      YjsEditor.connect(editor)
      return () => YjsEditor.disconnect(editor)
    }
  }, [editor])

  return (
    <>
      <Textbit>
        <div className={`flex flex-col h-screen ${!isSynced ? 'opacity-60' : ''}`}>
          <div className="grow-0">
            <ViewHeader {...props} title="Editor" icon={PenBoxIcon}>
              <Toolbar isSynced={isSynced} document={isSynced ? provider?.document : undefined} />
            </ViewHeader>
          </div>

          <ScrollArea>
            <div className="overscroll-auto">
              { /* @ts-expect-error yjsEditor needs more refinement */}
              <TextbitEditable yjsEditor={editor} />
            </div>
          </ScrollArea>

          <div className="grow-0 border-t opacity-90">
            <Footer />
          </div>
        </div>

      </Textbit>
    </>
  )
}

function Footer(): JSX.Element {
  const { words, characters } = useTextbitContext()

  return (
    <footer className="flex line font-sans text-sm p-3 pr-8 text-right gap-4 justify-end">
      <div className="flex gap-2">
        <strong>Words:</strong>
        <span>{words}</span>
      </div>
      <div className="flex gap-2">
        <strong>Characters:</strong>
        <span>{characters}</span>
      </div>
    </footer>
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
