import { ViewHeader } from '@/components'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import {
  TextbitEditable,
  Textbit,
  useTextbitContext
} from '@ttab/textbit'
import '@ttab/textbit/dist/esm/index.css'
import { useEffect, useMemo } from 'react'
import { createEditor } from 'slate'
import * as Y from 'yjs'

import { useQuery } from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ScrollArea } from '@ttab/elephant-ui'
import { EditorHeader } from './EditorHeader'
import { CollaborationProviderContext } from '@/contexts/CollaborationProvider'
import { useCollaboration } from '@/hooks/useCollaboration'

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
  const documentId = props.documentId || query.documentId

  return (
    <>
      {documentId
        ? <CollaborationProviderContext documentId={documentId}>
          <EditorViewContent {...props} />
        </CollaborationProviderContext>
        : <></>
      }
    </>
  )
}

function EditorViewContent(props: ViewProps): JSX.Element {
  const {
    provider,
    synced: isSynced,
    user
  } = useCollaboration()


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
        { data: user }
      )
    )
  }, [provider?.awareness, provider?.document, user])


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
              <EditorHeader isSynced={isSynced} document={isSynced ? provider?.document : undefined} />
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

Editor.meta = meta

export { Editor }
