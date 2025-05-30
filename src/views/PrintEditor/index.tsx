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
  useAwareness
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

import { type Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { Button, ScrollArea } from '@ttab/elephant-ui'
import { LayoutBox } from './LayoutBox'
import { ChevronRight, Copy, RefreshCw } from '@ttab/elephant-ui/icons'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import type { EleBlock } from '@/shared/types'

const meta: ViewMetadata = {
  name: 'PrintEditor',
  path: `${import.meta.env.BASE_URL || ''}/print-editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 4,
    uhd: 4
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
  const [layouts] = useYValue<EleBlock[]>('meta.tt/print-article[0].meta.tt/article-layout')
  const [name] = useYValue<string>('meta.tt/print-article[0].name')
  const [flowName] = useYValue<string>('links.tt/print-flow[0].title')

  const openPrintEditor = useLink('PrintEditor')
  if (!layouts) {
    return <p>no layouts</p>
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
                : <div className='flex items-center'>
                    <Button variant='ghost' size='sm' onClick={() => console.log('Uppdatera alla')}>
                      <RefreshCw strokeWidth={1.75} size={18} />
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => console.log('Kopiera')}>
                      <Copy strokeWidth={1.75} size={18} />
                    </Button>
                  </div>
                }
            </header>
            <ScrollArea className='h-[calc(100vh-12rem)]'>
              <div className='flex flex-col gap-2'>
                {Array.isArray(layouts) && layouts.map((layout, index) => {
                  console.log('layout', layout.data)
                  if (!layout.links?.['_']?.[0]?.uuid) {
                    return null
                  }
                  return (
                    <LayoutBox
                      key={layout.id}
                      documentId={documentId}
                      layoutIdForRender={layout.id}
                      layoutId={layout.links['_'][0].uuid}
                      index={index}
                      rendersCorrectly={layout.data?.status === 'true' ? true : false}
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
