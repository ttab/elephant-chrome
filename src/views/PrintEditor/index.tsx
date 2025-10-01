import { useCallback, useEffect, useRef, useState } from 'react'
import { AwarenessDocument, View } from '@/components'

import { Textbit, useTextbit } from '@ttab/textbit'
import {
  Bold,
  Italic,
  Text,
  TTVisual,
  Factbox,
  Table,
  LocalizedQuotationMarks,
  TVListing,
  PrintText
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
import { Notes } from '@/components/Notes'
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
import { CopyPlusIcon, ScanEyeIcon, SettingsIcon, TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Prompt } from '@/components/Prompt'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type * as Y from 'yjs'
import { ImagePlugin } from './ImagePlugin'
import { ChannelComboBox } from './components/ChannelComboBox'

const meta: ViewMetadata = {
  name: 'PrintEditor',
  path: `${import.meta.env.BASE_URL || ''}/print-editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 4,
    hd: 3,
    fhd: 3,
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
  const { data } = useSession()
  const { repository } = useRegistry()
  const { provider, synced, user } = useCollaboration()
  const openFactboxEditor = useLink('Factbox')
  const [notes] = useYValue<Block[] | undefined>('meta.core/note')
  const [, setIsFocused] = useAwareness(props.documentId)

  useEffect(() => {
    setIsFocused(true)
    return () => setIsFocused(false)
    // We only want to rerun when provider change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])

  // Plugin configuration
  const getConfiguredPlugins = () => {
    const basePlugins = [
      Bold,
      Italic,
      ImageSearchPlugin,
      FactboxPlugin,
      Table,
      LocalizedQuotationMarks,
      PrintText
    ]

    return [
      ...basePlugins.map((initPlugin) => initPlugin()),
      Text({
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      ImagePlugin({
        repository,
        accessToken: data?.accessToken || ''
      }),
      TVListing({
        channelComponent: ChannelComboBox
      }),
      TTVisual({
        enableCrop: true
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
  const openPrintArticle = useLink('PrintEditor')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const { stats } = useTextbit()
  const [layouts, setLayouts] = useYValue<EleBlock[]>('meta.tt/print-article[0].meta.tt/article-layout')
  const [name] = useYValue<string>('meta.tt/print-article[0].name')
  const [flowName] = useYValue<string>('links.tt/print-flow[0].title')
  const [flowUuid] = useYValue<string>('links.tt/print-flow[0].uuid')
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [, , allParams] = useQuery(['from'], true)
  const fromDate = allParams?.filter((item) => item.name === 'Print')?.[0]?.params?.from
  const [date] = useYValue<string>('meta.tt/print-article[0].data.date')
  const [isChanged] = useYValue<boolean>('root.changed')

  const handleChange = useCallback((value: boolean): void => {
    const root = provider?.document.getMap('ele').get('root') as Y.Map<unknown>
    const changed = root.get('changed') as boolean


    if (changed !== value) {
      root.set('changed', value)
    }
  }, [provider])

  if (!layouts) {
    return <p>no layouts</p>
  }
  const handleCopyArticle = async () => {
    if (!baboon || !session?.accessToken) {
      console.error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      return
    }
    await snapshotDocument(documentId)
    try {
      const _date = (fromDate || date) as string
      const response = await baboon.createPrintArticle({
        sourceUuid: documentId,
        flowUuid: flowUuid || '',
        date: _date,
        article: name || ''
      }, session.accessToken)
        .catch((ex: unknown) => {
          console.error('Error creating print article:', ex)
          toast.error('Något gick fel när printartikel skulle dupliceras nytt')
          setPromptIsOpen(false)
        })
      if (response?.status.code === 'OK') {
        openPrintArticle(undefined, { id: response?.response?.uuid }, 'self')
        setPromptIsOpen(false)
        toast.success('Printartikel har duplicerats till datumet: ' + _date)
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
    await snapshotDocument(documentId)
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
          const overflowsStatus = response?.response?.overflows?.length > 0
          const underflowsStatus = response?.response?.underflows?.length > 0
          const lowresPicsStatus = response?.response?.images?.filter((image) => image.ppi <= 130).length > 0
          const _checkedLayout = {
            ..._layout,
            data: {
              ..._layout?.data,
              status: overflowsStatus || underflowsStatus || lowresPicsStatus ? 'false' : 'true'
            }
          }
          results.push(_checkedLayout)
        }
      } catch (ex: unknown) {
        console.error('Error rendering article:', ex)
        toast.error('Något gick fel när printartikel skulle renderas')
      }
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
      <EditorHeader documentId={documentId} flowName={flowName} isChanged={isChanged} />
      {!!notes?.length && <div className='p-4'><Notes /></div>}
      <View.Content className='flex flex-col max-w-[1400px] grow'>
        <section className='flex'>
          <div className='w-2/3'>
            <ScrollArea className='h-[calc(100vh-7rem)]'>
              <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
                {!!provider && synced
                  ? (
                      <EditorContent provider={provider} user={user} onChange={handleChange} />
                    )
                  : (
                      <></>
                    )}
              </div>
            </ScrollArea>
          </div>
          <aside className='w-1/3 top-16 p-4'>
            <header className='flex flex-row gap-2 items-center justify-between mb-2'>
              <div className='flex items-center'>
                <Button variant='ghost' size='sm' onClick={() => { void statusChecker() }}>
                  <ScanEyeIcon strokeWidth={1.75} size={18} />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setPromptIsOpen(true)
                  }}
                >
                  <CopyPlusIcon strokeWidth={1.75} size={18} />
                </Button>
              </div>
              <h2 className={`text-base font-bold flex items-center gap-2 ${layouts.some((layout) => layout.data?.status === 'false') ? 'text-red-500' : ''}`}>
                {layouts.some((layout) => layout.data?.status === 'false')
                  ? <TriangleAlertIcon size={18} strokeWidth={1.75} className='text-red-500' />
                  : <span />}
                Layouter
                <span className='text-sm'>
                  (
                  {layouts.length}
                  )
                </span>
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
                      <span>Kontrollerar layouter</span>
                    </p>
                    <section className='flex flex-row items-center justify-center gap-0'>
                      <div className='animate-spin'>
                        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                      </div>
                      <div className='animate-spin mt-4'>
                        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
                      </div>
                      <div className='animate-spin'>
                        <SettingsIcon className='animate-pulse text-[#006bb3]' strokeWidth={1.75} size={24} />
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
                            onChange={handleChange}
                            deleteLayout={(layoutId) => {
                              const newLayouts = layouts.filter((_layout) => _layout.id !== layoutId)
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
          <span title='Antal ord: artikel (totalt)'>{`${stats.short.words} (${stats.full.words})`}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Tecken:</strong>
          <span title='Antal tecken: artikel (totalt)'>{`${stats.short.characters} (${stats.full.characters})`}</span>
        </div>
      </View.Footer>
    </>
  )
}


function EditorContent({ provider, user, onChange }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
  onChange?: (value: boolean) => void
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

  // Initialization of the editor causes a call to onChange, we're not interested in that.
  const hasInitialized = useRef(false)

  return (
    <Textbit.Editable
      ref={ref}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={onSpellcheck}
      onChange={(_value) => {
        if (hasInitialized.current) {
          onChange?.(true)
        } else {
          hasInitialized.current = true
        }
      }}
      className='outline-none
        h-full
        dark:text-slate-100
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
      '
    >
      <DropMarker />
      <Gutter>
        <ContentMenu />
      </Gutter>
      <Toolbar isPrintArticle />
      <ContextMenu />
    </Textbit.Editable>
  )
}

PrintEditor.meta = meta

export { PrintEditor }
