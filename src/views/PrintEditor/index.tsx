import { useEffect, useRef, useState } from 'react'
import { AwarenessDocument, View } from '@/components'

import { Textbit, useTextbit } from '@ttab/textbit'
import {
  Bold,
  Italic,
  Link,
  Text,
  TTVisual,
  Factbox,
  Table,
  LocalizedQuotationMarks,
  TVListing
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
  useAwareness,
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

import { type Block } from '@ttab/elephant-api/newsdoc'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { Button, ScrollArea } from '@ttab/elephant-ui'
import { LayoutBox } from './LayoutBox'
import { Copy, ScanEye, Settings } from '@ttab/elephant-ui/icons'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Prompt } from '@/components/Prompt'
import { snapshot } from '@/lib/snapshot'

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
      LocalizedQuotationMarks,
      TVListing
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
        removable: true,
        ...contentMenuLabels
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
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [checkingCounter, setCheckingCounter] = useState(1)
  const { words, characters } = useTextbit()
  const [layouts, setLayouts] = useYValue<EleBlock[]>('meta.tt/print-article[0].meta.tt/article-layout')
  const [name] = useYValue<string>('meta.tt/print-article[0].name')
  const [flowName] = useYValue<string>('links.tt/print-flow[0].title')
  const [flowUuid] = useYValue<string>('links.tt/print-flow[0].uuid')
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [,,allParams] = useQuery(['from'], true)
  const date = allParams?.filter((item) => item.name === 'PrintArticles')?.[0]?.params?.from || ''

  if (!layouts) {
    return <p>no layouts</p>
  }
  const handleCopyArticle = async () => {
    if (!baboon || !session?.accessToken) {
      console.error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      return
    }
    try {
      const response = await baboon.createPrintArticle({
        sourceUuid: documentId,
        flowUuid: flowUuid || '',
        date: date as string,
        article: name || ''
      }, session.accessToken)
      if (response?.status.code === 'OK') {
        setPromptIsOpen(false)
      }
    } catch (ex: unknown) {
      console.error('Error creating print article:', ex)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      setPromptIsOpen(false)
    }
  }
  async function processArray(arr: EleBlock[]) {
    if (!baboon || !session?.accessToken) {
      console.error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
      toast.error('Något gick fel när printartikel skulle renderas')
      return
    }
    await snapshot(documentId)
    const results: EleBlock[] = []
    for (const _layout of arr) {
      try {
        const response = await baboon.renderArticle({
          articleUuid: documentId,
          layoutId: _layout.id,
          renderPdf: true,
          renderPng: false,
          pngScale: 300n
        }, session.accessToken)
        if (response?.status.code === 'OK') {
          const _checkedLayout = {
            ..._layout,
            data: {
              ..._layout?.data,
              status: response?.response?.overflows?.length ? 'false' : 'true'
            }
          }
          if (response?.response?.overflows?.length) {
            const _toastText = response?.response?.overflows?.map((overflow) => overflow.frame).join('\n')
            toast.error(`${response?.response?.overflows?.length} fel uppstod när printartikel skulle renderas: ${_toastText}`)
          } else {
            toast.success('Layouten är fungerar')
          }
          results.push(_checkedLayout)
        }
      } catch (ex: unknown) {
        console.error('Error rendering article:', ex)
        toast.error('Något gick fel när printartikel skulle renderas')
      }
      setCheckingCounter(checkingCounter + 1)
    }

    return results
  }
  const statusChecker = async () => {
    setIsChecking(true)
    const newLayouts = await processArray(layouts)
    setLayouts(newLayouts || [])
    setIsChecking(false)
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
              <div className='flex items-center'>
                <Button variant='ghost' size='sm' onClick={() => { void statusChecker() }}>
                  <ScanEye strokeWidth={1.75} size={18} />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setPromptIsOpen(true)
                  }}
                >
                  <Copy strokeWidth={1.75} size={18} />
                </Button>
              </div>
              <h2 className='text-base font-bold'>
                Layouter (
                {layouts.length}
                )
              </h2>
            </header>
            {promptIsOpen && (
              <Prompt
                title='Duplicera artikel'
                description='Är du säker på att du vill duplicera denna artikel?'
                primaryLabel='Duplicera'
                secondaryLabel='Avbryt'
                onPrimary={() => {
                  void handleCopyArticle().catch(console.error)
                  setPromptIsOpen(false)
                }}
                onSecondary={() => {
                  setPromptIsOpen(false)
                }}
              />
            )}
            {isChecking
              ? (
                  <main className='flex flex-col items-center justify-center mt-8 gap-4'>
                    <p className='flex gap-1'>
                      <span>Kontrollerar</span>
                      <span>{checkingCounter}</span>
                      <span>av</span>
                      <span>{layouts.length}</span>
                      <span>layouter</span>
                    </p>
                    <section className='flex flex-row items-center justify-center gap-0'>
                      <div className='animate-spin'>
                        <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                      </div>
                      <div className='animate-spin mt-4'>
                        <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                      </div>
                      <div className='animate-spin'>
                        <Settings className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                      </div>
                    </section>
                  </main>
                )
              : (
                  <ScrollArea className='h-[calc(100vh-12rem)]'>
                    <div className='flex flex-col gap-2'>
                      {Array.isArray(layouts) && layouts.map((layout, index) => {
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
                            deleteLayout={(layoutId) => {
                              const newLayouts = layouts.filter((_layout) => _layout.links['_'][0].uuid !== layoutId)
                              setLayouts(newLayouts)
                            }}
                          />
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
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
