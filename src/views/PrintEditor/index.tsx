import { useEffect, useState, useRef } from 'react'
import { AwarenessDocument, View } from '@/components'
import { Notes } from './components/Notes'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  Label,
  ScrollArea
} from '@ttab/elephant-ui'
import { Eye, X, CircleCheckBig, TriangleAlert, ChevronDown, ChevronRight, Plus } from '@ttab/elephant-ui/icons'

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

import {
  useQuery,
  useCollaboration,
  useLink,
  useYValue,
  useView,
  useYjsEditor,
  useAwareness
} from '@/hooks'
import { type ViewMetadata, type ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
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

import type { Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/lib/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'

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

function LayoutBox({
  bulkSelected,
  setBulkSelected,
  valid,
  id,
  name
}: {
  bulkSelected: string[]
  setBulkSelected: (bulkSelected: string[]) => void
  valid: boolean
  id: number
  name: string
}) {
  const openPreview = useLink('PrintPreview')
  const layouts = [
    {
      name: 'Topp-3sp',
      value: 'topp-3sp'
    },
    {
      name: 'Topp-4sp',
      value: 'topp-4sp'
    },
    {
      name: 'Topp-5sp',
      value: 'topp-5sp'
    },
    {
      name: 'Topp-6sp',
      value: 'topp-6sp'
    },
    {
      name: 'Topp-7sp',
      value: 'topp-7sp'
    },
    {
      name: 'Topp-8sp',
      value: 'topp-8sp'
    },
    {
      name: 'Topp-9sp',
      value: 'topp-9sp'
    },
    {
      name: 'Topp-10sp',
      value: 'topp-10sp'
    },
    {
      name: 'Topp-11sp',
      value: 'topp-11sp'
    }
  ]

  return (
    <div className='border min-h-32 p-2 pt-0 grid grid-cols-12 gap-2 rounded'>
      <header className='col-span-12 row-span-1 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {valid
            ? (
                <CircleCheckBig strokeWidth={1.75} size={18} color='green' />
              )
            : (
                <TriangleAlert strokeWidth={1.75} size={18} color='red' />
              )}
          <Button
            variant='ghost'
            className='px-2 py-0'
            size='sm'
            onClick={() => openPreview(undefined, { id: id.toString() })}
          >
            <Eye strokeWidth={1.75} size={16} />
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <Label className='group/check flex items-center gap-4'>
            <span className='transition-opacity ease-in-out delay-500 opacity-0 group-hover/check:opacity-100'>
              {bulkSelected.includes(id.toString()) ? '' : 'Välj'}
            </span>
            <Input
              value={id}
              type='checkbox'
              className='w-4 h-4'
              checked={bulkSelected.includes(id.toString())}
              onChange={(e) => {
                if (e.target.checked) {
                  setBulkSelected([...bulkSelected, id.toString()])
                } else {
                  setBulkSelected(bulkSelected.filter((_id) => _id !== id.toString()))
                }
              }}
            />
          </Label>
          <Button
            variant='ghost'
            className='p-2'
            onClick={(e) => {
              e.preventDefault()
              window.alert('Ej implementerat ännu')
            }}
          >
            <X strokeWidth={1.75} size={18} />
          </Button>
        </div>
      </header>
      <div className='col-span-12 row-span-1'>
        <Input type='text' placeholder='Namn' defaultValue={name} />
      </div>
      <div className='col-span-6 row-span-1'>
        <Popover>
          <PopoverTrigger className='w-full'>
            <div className='text-sm border rounded-md p-2 flex gap-1 items-center justify-between w-full'>
              Topp-3sp
              <ChevronDown strokeWidth={1.75} size={18} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder='Sök' />
              <CommandList className='text-sm bg-white'>
                {layouts.map((layout) => (
                  <CommandItem key={layout.value} className='bg-white'>
                    {layout.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className='col-span-6 row-span-1'>
        <Popover>
          <PopoverTrigger className='w-full'>
            <div className='text-sm border rounded-md p-2 flex gap-1 items-center justify-between w-full'>
              2
              <ChevronDown strokeWidth={1.75} size={18} />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <Command>
              <CommandInput placeholder='Sök' />
              <CommandList className='text-sm bg-white'>
                {layouts.map((layout) => (
                  <CommandItem key={layout.value} className='bg-white'>
                    {layout.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className='col-span-12 row-span-1 flex flex-col gap-2'>
        <h4 className='text-sm font-bold'>Tillägg</h4>
        <Label className='flex items-center gap-2'>
          <Input type='checkbox' className='w-4 h-4' />
          Faktaruta
        </Label>
        <Label className='flex items-center gap-2'>
          <Input type='checkbox' className='w-4 h-4' />
          Porträttbild 2
        </Label>
        <Label className='flex items-center gap-2'>
          <Input type='checkbox' className='w-4 h-4' />
          Extrabild trespaltare
        </Label>
      </div>
    </div>
  )
}

// Main Editor Component - Handles document initialization
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
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')
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
  documentId,
  notes
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
  notes: Block[] | undefined
}): JSX.Element {
  const { words, characters } = useTextbit()
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const openPrintEditor = useLink('PrintEditor')

  const layouts = [
    {
      name: 'DN',
      valid: true,
      id: 1
    },
    {
      name: 'Expressen',
      valid: true,
      id: 2
    },
    {
      name: 'Tre',
      valid: true,
      id: 3
    },
    {
      name: 'Fyra',
      valid: false,
      id: 4
    },
    {
      name: 'Fem',
      valid: false,
      id: 5
    }
  ]

  return (
    <>
      <EditorHeader documentId={documentId} />

      <View.Content className='flex flex-col max-w-[1200px]'>
        <section className='grid grid-cols-12'>
          <div className='col-span-8'>
            <ScrollArea className='h-[calc(100vh-7rem)]'>
              {!!notes?.length && (
                <div className='p-4'>
                  <Notes />
                </div>
              )}

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
              <h2 className='text-base font-bold'>Layouter</h2>
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
                    <Button
                      title='Skapa en ny layout'
                      variant='outline'
                      className='p-2 flex gap-2 items-center'
                      onClick={(e) => {
                        e.preventDefault()
                        window.alert('Ej implementerat ännu')
                      }}
                    >
                      <Plus strokeWidth={1.75} size={18} />
                      Ny layout
                    </Button>
                  )}
            </header>
            <ScrollArea className='h-[calc(100vh-12rem)]'>
              <div className='flex flex-col gap-2'>
                {layouts.map((layout) => (
                  <LayoutBox
                    key={layout.id}
                    bulkSelected={bulkSelected}
                    setBulkSelected={setBulkSelected}
                    valid={layout.valid}
                    id={layout.id}
                    name={layout.name}
                  />
                ))}
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
