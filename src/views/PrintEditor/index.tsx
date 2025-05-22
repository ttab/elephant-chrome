import { useEffect, useRef, useState } from 'react'
import { AwarenessDocument, View } from '@/components'

import { Textbit, useTextbit } from '@ttab/textbit'
import { Bold, Italic, Link, Text, TTVisual, Factbox, Table, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'

import {
  useQuery,
  useCollaboration,
  useLink,
  useYValue,
  useView,
  useYjsEditor,
  useAwareness,
  useWorkflowStatus,
  useRegistry
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './PrintEditorHeader'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { Error } from '../Error'

import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'

import { type Block, type Document } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { toast } from 'sonner'
import { useLayouts } from '@/hooks/baboon/useLayouts'
import { useSession } from 'next-auth/react'
import { Button, Popover, PopoverTrigger, PopoverContent, ScrollArea } from '@ttab/elephant-ui'
import { LayoutBox } from './LayoutBox'
import { ChevronRight, RefreshCw, EllipsisVertical } from '@ttab/elephant-ui/icons'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
// Metadata definition
const meta: ViewMetadata = {
  name: 'PrintEditor',
  path: `${import.meta.env.BASE_URL || ''}/print-editor`,
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

// Main Editor Component - Handles document initialization
const PrintEditor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const documentId = props.id || query.id as string

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  return (
    <AwarenessDocument documentId={documentId} className='h-full'>
      <EditorWrapper documentId={documentId} {...props} />
    </AwarenessDocument>
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  autoFocus?: boolean
}): JSX.Element {
  const { provider, synced, user } = useCollaboration()
  const openFactboxEditor = useLink('Factbox')
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')
  const [, setIsFocused] = useAwareness(props.documentId)

  // Plugin configuration
  const getConfiguredPlugins = () => {
    const basePlugins = [
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
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      Factbox({
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        },
        removable: true
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
          notes={notes}
        />
      </Textbit.Root>
    </View.Root>
  )
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
  notes: Block[] | undefined
}): JSX.Element {
  const { words, characters } = useTextbit()
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [layouts, setLayouts] = useState<Block[]>([])
  const [cleanLayouts, setCleanLayouts] = useState<Block[]>()

  const [isDirty, setIsDirty] = useState<string | undefined>(undefined)
  const openPrintEditor = useLink('PrintEditor')
  const { data: doc } = useLayouts(documentId) as { data: { layouts: Block[], document: Document } }
  const { data: session } = useSession()
  const { repository } = useRegistry()
  const [workflowStatus] = useWorkflowStatus(documentId, true)
  useEffect(() => {
    if (doc) {
      setLayouts(doc.layouts)
    }
  }, [doc])
  useEffect(() => {
    if (layouts && !isDirty) {
      setCleanLayouts(layouts)
    }
  }, [layouts, isDirty])
  const name: string = doc?.document?.meta.filter((m: { type: string }) => m.type === 'tt/print-article')[0]?.name || ''
  const flowName: string = doc?.document?.links.filter((m: { type: string }) => m.type === 'tt/print-flow')[0]?.title || ''
  const updateLayout = (_layout: Block) => {
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
  const deleteLayout = (_layout: Block) => {
    const updatedLayouts = layouts.filter((layout) => layout.id !== _layout.id)
    setLayouts(updatedLayouts)
    saveUpdates(updatedLayouts)
  }
  const saveUpdates = (updatedLayouts: Block[] | undefined) => {
    const _meta: Block[] = doc?.document?.meta?.map((m) => {
      if (m.type === 'tt/print-article') {
        return Object.assign({}, m, {
          meta: updatedLayouts || layouts
        })
      }
      return m
    })
    const _document: Document = Object.assign({}, doc?.document, {
      meta: _meta
    })
    if (!repository || !session) {
      return (
        <Error
          title='Repository or session not found'
          message='Layouter sparades inte'
        />
      )
    }
    (async () => {
      const result = await repository.saveDocument(_document, session.accessToken, 0n, workflowStatus?.name || 'draft')
      if (result?.status?.code !== 'OK') {
        return (
          <Error
            title='Failed to save print article'
            message='Layouter sparades inte'
          />
        )
      }
      setIsDirty(undefined)
      setLayouts(updatedLayouts || layouts)
      toast.success('Layouter är sparad')
    })().catch((error) => {
      console.error(error)
      toast.error('Layouter sparades inte')
    })
  }
  return (
    <>
      <EditorHeader documentId={documentId} name={name} flowName={flowName} />
      <View.Content className='flex flex-col max-w-[1000px]'>
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
                : (
                  <DotDropdownMenu
                    trigger='vertical'
                    items={[
                    {
                      label: 'Uppdatera alla',
                      icon: RefreshCw,
                      item: (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='flex gap-2 items-center'
                          onClick={(e) => {
                            e.preventDefault()
                            window.alert('Ej implementerat')
                          }}
                        >
                          <RefreshCw strokeWidth={1.75} size={16} />
                          Uppdatera alla
                        </Button>
                      )
                    }
                  ]}
                />
              )}
            </header>
            <ScrollArea className='h-[calc(100vh-12rem)]'>
              <div className='flex flex-col gap-2'>
                {Array.isArray(layouts) && layouts.map((layout: Block) => {
                  if (!layout) {
                    return null
                  }
                  return (
                    <LayoutBox
                      key={layout.id}
                      bulkSelected={bulkSelected}
                      setBulkSelected={setBulkSelected}
                      documentId={documentId}
                      layout={layout}
                      updateLayout={updateLayout}
                      isDirty={isDirty}
                      setIsDirty={() => setIsDirty(undefined)}
                      setLayouts={(newLayouts: Block[] | ((prevState: Block[]) => Block[])) => setLayouts(newLayouts)}
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
          <strong>Ord:</strong>
          <span>{words}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Tecken:</strong>
          <span>{characters}</span>
        </div>
      </View.Footer>
    </>
  )
}


function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

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

PrintEditor.meta = meta

export { PrintEditor }
