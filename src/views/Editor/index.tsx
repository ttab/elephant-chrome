import { useMemo, useEffect, useState, useRef } from 'react'
import { AwarenessDocument, View, ViewHeader } from '@/components'
import { Notes } from './components/Notes'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'

import { createEditor } from 'slate'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import type * as Y from 'yjs'

import { Textbit, useTextbit } from '@ttab/textbit'

import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'

import { Bold, Italic, Link, Text, OrderedList, UnorderedList, TTVisual, Factbox, Table } from '@ttab/textbit-plugins'

import {
  useQuery,
  useCollaboration,
  useRegistry,
  useLink,
  useYValue,
  useView,
  useSupportedLanguages
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
import type { Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/lib/yUtils'

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

  if (!documentId || typeof documentId !== 'string') {
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
  autoFocus?: boolean
}): JSX.Element {
  const plugins = [UnorderedList, OrderedList, Bold, Italic, Link, TTVisual, ImageSearchPlugin, FactboxPlugin, Table]
  const { provider, synced, user } = useCollaboration()
  const openFactboxEditor = useLink('Factbox')
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')
  const { words, characters } = useTextbit()

  return (
    <View.Root>
      <Textbit.Root
        autoFocus={props.autoFocus ?? true}
        plugins={
          [
            ...plugins.map((initPlugin) => initPlugin()),
            Text({
              countCharacters: ['heading-1']
            }),
            Factbox({
              onEditOriginal: (id: string) => {
                openFactboxEditor(undefined, { id })
              }
            })
          ]
        }
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <ViewHeader.Root>
          <ViewHeader.Title title='Editor' icon={PenBoxIcon} />

          <ViewHeader.Content>
            <EditorHeader documentId={props.documentId} />
          </ViewHeader.Content>

          <ViewHeader.Action>
            {!!props.documentId && <ViewHeader.RemoteUsers documentId={props.documentId} />}
          </ViewHeader.Action>
        </ViewHeader.Root>

        <View.Content className='flex flex-col max-w-[1000px]'>
          {notes?.length && <div className='p-4'><Notes /></div>}

          <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
            {!!provider && synced
              ? <EditorContent provider={provider} user={user} />
              : <></>}
          </div>
        </View.Content>

        <View.Footer>
          <div className='flex gap-2'>
            <strong>Words:</strong>
            <span>{words}</span>
          </div>
          <div className='flex gap-2'>
            <strong>Characters:</strong>
            <span>{characters}</span>
          </div>
        </View.Footer>

      </Textbit.Root>
    </View.Root>
  )
}

function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { data: session } = useSession()
  const { spellchecker } = useRegistry()
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const supportedLanguages = useSupportedLanguages()

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

  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])

  // Connect/disconnect from provider through editor only when editor changes
  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  return (
    <Textbit.Editable
      ref={ref}
      yjsEditor={yjsEditor}
      onSpellcheck={async (texts) => {
        if (documentLanguage) {
          const spellingResult = await spellchecker?.check(texts, documentLanguage, supportedLanguages, session?.accessToken ?? '')
          if (spellingResult) {
            return spellingResult
          }
        }
        return []
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

Editor.meta = meta

export { Editor }
