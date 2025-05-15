import { useEffect, useState, useRef } from 'react'
import { AwarenessDocument, View } from '@/components'
import {
  Button,
  ScrollArea
} from '@ttab/elephant-ui'
import { ChevronRight } from '@ttab/elephant-ui/icons'
import { useLayouts } from '@/hooks/baboon/useLayouts'

import type * as Y from 'yjs'

import { Textbit, useTextbit } from '@ttab/textbit'
import {
  Bold,
  Italic,
  Link,
  Text,
  OrderedList,
  UnorderedList,
  TTVisual,
  Factbox,
  Table,
  LocalizedQuotationMarks
} from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { toast } from 'sonner'

import {
  useQuery,
  useCollaboration,
  useLink,
  useView,
  useYjsEditor,
  useAwareness,
  useRegistry,
  useWorkflowStatus
} from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { EditorHeader } from './PrintEditorHeader'
import { LayoutBox } from './LayoutBox'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { articleDocumentTemplate } from '@/defaults/templates/articleDocumentTemplate'
import { createDocument } from '@/lib/createYItem'
import { Error } from '../Error'

import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'

import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { useSession } from 'next-auth/react'

// Metadata definition
const meta: ViewMetadata = {
  name: 'PrintEditor',
  path: `${import.meta.env.BASE_URL || ''}/print`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 6,
    qhd: 3,
    uhd: 2
  }
}

/**
 * PrintEditor Component - Handles document initialization
 *
 * This component is responsible for initializing the document for the Print Editor.
 * It checks for the presence of a document ID and handles the creation of a new document
 * if necessary. If the document ID is missing or invalid, it displays an error message.
 *
 * @param props - The properties object containing view-related data.
 * @returns The rendered PrintEditor component or an error message if the document ID is missing.
 */

const PrintEditor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const [document, setDocument] = useState<Y.Doc | undefined>(undefined)
  const documentId = props.id || query.id
  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  // Document creation if needed
  if (props.onDocumentCreated && !document) {
    const [, doc] = createDocument({
      template: (id: string) => {
        return articleDocumentTemplate(id, props?.payload)
      },
      documentId
    })
    setDocument(doc)
    return <></>
  }
  if (document && props.onDocumentCreated) {
    props.onDocumentCreated()
  }
  return (
    <AwarenessDocument
      documentId={documentId}
      document={document}
      className='h-full'
    >
      <EditorWrapper documentId={documentId} {...props} />
    </AwarenessDocument>
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(
  props: ViewProps & {
    documentId: string
    autoFocus?: boolean
  }
): JSX.Element {
  const { provider, synced, user } = useCollaboration()
  const openFactboxEditor = useLink('Factbox')
  const [, setIsFocused] = useAwareness(props.documentId)

  // Plugin configuration
  const getConfiguredPlugins = () => {
    const basePlugins = [
      UnorderedList,
      OrderedList,
      Bold,
      Italic,
      Link,
      TTVisual,
      ImageSearchPlugin,
      FactboxPlugin,
      Table,
      LocalizedQuotationMarks
    ]

    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
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

  return (
    <View.Root>
      <Textbit.Root
        autoFocus={props.autoFocus ?? true}
        onBlur={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsFocused(true)
        }}
        plugins={getConfiguredPlugins()}
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <EditorContainer
          provider={provider}
          synced={synced}
          user={user}
          documentId={props.documentId}
        />
      </Textbit.Root>
    </View.Root>
  )
}

type Layout = {
  id: string | undefined
  name: string
  links: {
    rel: string
    name: string
    href: string
  }[]
  meta: {
    content: string
    type: string
  }[]
  data: {
    position: string
  }
  type: string
}

// Container component that uses TextBit context
function EditorContainer({
  provider,
  synced,
  user,
  documentId
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
}): JSX.Element {
  const { words, characters } = useTextbit()
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [cleanLayouts, setCleanLayouts] = useState<Layout[]>()

  const [isDirty, setIsDirty] = useState(undefined)
  const openPrintEditor = useLink('PrintEditor')
  const { data: doc } = useLayouts(documentId)
  const { data: session } = useSession()
  const { repository } = useRegistry()
  const [workflowStatus] = useWorkflowStatus(documentId, true)
  useEffect(() => {
    if (doc) {
      setLayouts(doc.layouts as Layout[])
    }
  }, [doc])
  useEffect(() => {
    if (layouts && !isDirty) {
      setCleanLayouts(layouts)
    }
  }, [layouts])
  const name = doc?.document?.document?.meta.filter((m: { type: string }) => m.type === 'tt/print-article')[0]?.name
  const flowName = doc?.document?.document?.links.filter((m: { type: string }) => m.type === 'tt/print-flow')[0]?.title
  console.log('flowName', flowName)
  const updateLayout = (_layout: Layout) => {
    const box = document.getElementById(_layout.id)
    if (box) {
      box.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const updatedLayouts = layouts.map((layout) => {
      if (layout.id === _layout.id) {
        return _layout
      }
      return layout
    })
    setLayouts(updatedLayouts)
    setIsDirty(_layout.id)
  }
  const deleteLayout = (_layout: Layout) => {
    const updatedLayouts = layouts.filter((layout) => layout.id !== _layout.id)
    setLayouts(updatedLayouts)
    saveUpdates(updatedLayouts)
  }
  const saveUpdates = (updatedLayouts: Layout[] | undefined) => {
    const _meta = doc?.document?.document?.meta?.map((m: { type: string }) => {
      if (m.type === 'tt/print-article') {
        return Object.assign({}, m, {
          meta: updatedLayouts || layouts
        })
      }
      return m
    })
    const _document = Object.assign({}, doc?.document?.document, {
      meta: _meta
    })
    if (!repository || !session) {
      throw new Error('Repository or session not found')
    }
    (async () => {
      const result = await repository.saveDocument(_document as Document, session.accessToken, 0n, workflowStatus?.name || 'draft')
      if (result?.status.code !== 'OK') {
        throw new Error('Failed to save print article')
      }
      setIsDirty(undefined)
      setLayouts(updatedLayouts || layouts)
      toast.success(`Layouter är sparad`)
    })().catch((error) => {
      console.error(error)
      toast.error('Layouter sparades inte')
    })
  }

  return (
    <>
      <EditorHeader documentId={documentId} flowName={flowName} name={name} />

      <View.Content className='flex flex-col max-w-[1200px]'>
        <section className='grid grid-cols-12'>
          <div className='col-span-8'>
            <ScrollArea className='h-[calc(100vh-7rem)]'>
              <div className='flex-grow overflow-auto pr-12 max-w-screen-xl'>
                {!!provider && synced
                  ? (
                      <EditorContent provider={provider} user={user} />
                    )
                  : (
                      <></>
                    )}
              </div>
            </ScrollArea>
          </div>
          <aside className='col-span-4 sticky top-16 p-4'>
            <header className='flex flex-row gap-2 items-center justify-between mb-2'>
              <h2 className='text-base font-bold'>
                Layouter (
                {layouts.length}
                )
              </h2>
              {bulkSelected.length > 0
                ? (
                    <Button
                      title='När layouter har valts, visa alternativ för att skapa en kopia av texten med de valda layouterna och ta bort dem från nuvarande artikel. Öppna kopian direkt till höger'
                      className='p-2 flex gap-2 items-center'
                      onClick={() => {
                        openPrintEditor(undefined, { id: documentId })
                        setBulkSelected([])
                      }}
                    >
                      Flytta till kopia
                      <span className='text-sm font-bold'>
                        {`(${bulkSelected.length} st)`}
                      </span>
                      <ChevronRight strokeWidth={1.75} size={18} />
                    </Button>
                  )
                : null}
            </header>
            <ScrollArea className='h-[calc(100vh-12rem)]'>
              <div className='flex flex-col gap-2'>
                {Array.isArray(layouts) && layouts.map((layout: Layout) => {
                  if (!layout) {
                    return null
                  }
                  return (
                    <LayoutBox
                      key={layout.id}
                      bulkSelected={bulkSelected}
                      setBulkSelected={setBulkSelected}
                      layout={layout}
                      updateLayout={updateLayout}
                      isDirty={isDirty}
                      setIsDirty={() => setIsDirty(undefined)}
                      setLayouts={(newLayouts: Layout[] | ((prevState: Layout[]) => Layout[])) => setLayouts(newLayouts)}
                      cleanLayouts={cleanLayouts || []}
                      saveUpdates={() => saveUpdates(layouts || [])}
                      deleteLayout={() => deleteLayout(layout)}
                    />
                  )
                })}
              </div>
            </ScrollArea>
          </aside>
        </section>
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
    </>
  )
}

function EditorContent({
  provider,
  user
}: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(
    provider.document.getMap('ele'),
    'root.language'
  )

  const yjsEditor = useYjsEditor(provider, user)
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  // Handle focus on active state
  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])
  return (
    <Textbit.Editable
      ref={ref}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={onSpellcheck}
      className='outline-none h-full dark:text-slate-100 [&_[data-spelling-error]]:border-b-2 [&_[data-spelling-error]]:border-dotted [&_[data-spelling-error]]:border-red-500'
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

PrintEditor.meta = meta

export { PrintEditor }
