import { useMemo, useEffect, useState } from 'react'
import { AwarenessDocument, ViewHeader } from '@/components'
import { Notes } from './components/Notes'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'

import { createEditor } from 'slate'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import type * as Y from 'yjs'

import { Textbit, useTextbit } from '@ttab/textbit'

import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'

import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox } from '@ttab/textbit-plugins'

import {
  useQuery,
  useCollaboration,
  useRegistry
} from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { articleDocumentTemplate, type ArticlePayload } from '@/defaults/templates/articleDocumentTemplate'
import { createDocument } from '@/lib/createYItem'
import { Error } from '../Error'
import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'
import { useSession } from 'next-auth/react'

const meta: ViewMetadata = {
  name: 'Editor',
  path: `${import.meta.env.BASE_URL || ''}/editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

const Editor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const [document, setDocument] = useState<Y.Doc | undefined>(undefined)

  const documentId = props.id || query.id

  if (!documentId) {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument<ArticlePayload>((id: string) => articleDocumentTemplate(id, props?.payload))
    setDocument(doc)

    return <></>
  }

  if (document && props.onDocumentCreated) {
    props.onDocumentCreated()
  }

  return (
    <AwarenessDocument documentId={documentId} document={document} className='h-full'>
      <EditorWrapper documentId={documentId} {...props} />
    </AwarenessDocument>
  )
}

function EditorWrapper(props: ViewProps & {
  documentId: string
}): JSX.Element {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, ImageSearchPlugin, Factbox, FactboxPlugin]
  const {
    provider,
    synced,
    user
  } = useCollaboration()
  return (
    <Textbit.Root plugins={plugins.map((initPlugin) => initPlugin())} placeholders='multiple' className='h-screen max-h-screen flex flex-col'>
      <ViewHeader.Root>
        <ViewHeader.Title title='Editor' icon={PenBoxIcon} />

        <ViewHeader.Content>
          <EditorHeader />
        </ViewHeader.Content>

        <ViewHeader.Action>
          {!!props.documentId
          && <ViewHeader.RemoteUsers documentId={props.documentId} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <div className='p-4'>
        <Notes />
      </div>

      <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
        {!!provider && synced
          ? <EditorContent provider={provider} user={user} />
          : <></>}
      </div>

      <div className='h-14 basis-14'>
        <Footer />
      </div>
    </Textbit.Root>
  )
}

function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { data: session } = useSession()
  const { spellchecker, locale } = useRegistry()

  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    const content = provider.document.getMap('ele').get('content') as YXmlText

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          content
        ),
        provider.awareness,
        { data: user as unknown as Record<string, unknown> }
      )
    )
  }, [provider?.awareness, provider?.document, user])


  // Connect/disconnect from provider through editor only when editor changes
  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <Textbit.Editable
      yjsEditor={yjsEditor}
      onSpellcheck={async (texts) => {
        return await spellchecker?.check(texts, locale, session?.accessToken ?? '') ?? []
      }}
      className='outline-none
        h-full
        dark:text-slate-100
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
      '
    >
      <DropMarker />

      <Gutter>
        <ContentMenu />
      </Gutter>

      <Toolbar />
      <ContextMenu />
    </Textbit.Editable>
  )
}


function Footer(): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <footer className='flex line font-sans h-14 border-t text-sm p-3 pr-8 text-right gap-4 justify-end items-center'>
      <div className='flex gap-2'>
        <strong>Words:</strong>
        <span>{words}</span>
      </div>
      <div className='flex gap-2'>
        <strong>Characters:</strong>
        <span>{characters}</span>
      </div>
    </footer>
  )
}

Editor.meta = meta

export { Editor }
