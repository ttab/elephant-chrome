import { useEffect, useRef, useState } from 'react'

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
  useLink,
  useView,
  useYjsEditor,
  useRegistry
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './PrintEditorHeader'
import { Error as ErrorView } from '../Error'

import { ContentMenu } from '@/components/Editor/ContentMenu'
import { Notes } from '@/components/Notes'
import { Toolbar } from '@/components/Editor/Toolbar'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Gutter } from '@/components/Editor/Gutter'
import { DropMarker } from '@/components/Editor/DropMarker'

import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { Button, ScrollArea } from '@ttab/elephant-ui'
import { LayoutBox } from './LayoutBox'
import { CopyPlusIcon, FileIcon, ScanEyeIcon, SettingsIcon, TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Prompt } from '@/components/Prompt'
import { snapshotDocument } from '@/lib/snapshotDocument'
import type * as Y from 'yjs'
import { ImagePlugin } from './ImagePlugin'
import { ChannelComboBox } from './components/ChannelComboBox'
import { ToastAction } from '../Wire/ToastAction'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { View } from '@/components/View'

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
      <ErrorView
        title='Artikeldokument saknas'
        message='Inget artikeldokument är angivet. Navigera tillbaka till översikten och försök igen.'
      />
    )
  }

  return (
    <EditorWrapper documentId={documentId} {...props} />
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  autoFocus?: boolean
}): JSX.Element {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId)

  const { data } = useSession()
  const { repository } = useRegistry()
  const openFactboxEditor = useLink('Factbox')

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
        channelComponent: () => ChannelComboBox({ ydoc })
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
          ydoc={ydoc}
        />
      </Textbit.Root>
    </View.Root>
  )
}


// Container component that uses TextBit context
function EditorContainer({
  ydoc
}: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element {
  const openPrintArticle = useLink('PrintEditor')
  const [promptIsOpen, setPromptIsOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const { stats } = useTextbit()
  const [layouts, setLayouts] = useYValue<EleBlock[]>(ydoc.ele, 'meta.tt/print-article[0].meta.tt/article-layout')
  const [name] = useYValue<string>(ydoc.ele, 'meta.tt/print-article[0].name')
  const [flowName] = useYValue<string>(ydoc.ele, 'links.tt/print-flow[0].title')
  const [flowUuid] = useYValue<string>(ydoc.ele, 'links.tt/print-flow[0].uuid')
  const { baboon } = useRegistry()
  const { data: session } = useSession()
  const [, , allParams] = useQuery(['from'], true)
  const fromDate = allParams?.filter((item) => item.name === 'Print')?.[0]?.params?.from
  const [date] = useYValue<string>(ydoc.ele, 'meta.tt/print-article[0].data.date')

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
      const _date = (fromDate || date) as string
      const response = await baboon.createPrintArticle({
        sourceUuid: ydoc.id,
        flowUuid: flowUuid || '',
        date: _date,
        article: name || ''
      }, session.accessToken)

      if (response?.status.code === 'OK') {
        openPrintArticle(undefined, { id: response?.response?.uuid }, 'self')
        setPromptIsOpen(false)
        toast.success(`Printartikel har duplicerats till: ${_date}`, {
          action: (
            <ToastAction
              documentId={response?.response?.uuid}
              withView='PrintEditor'
              label='Öppna artikeln'
              Icon={FileIcon}
              target='self'
            />
          )
        })
      }
    } catch (ex: unknown) {
      console.error('Error creating print article:', ex)
      toast.error('Något gick fel när printartikel skulle dupliceras')
      setPromptIsOpen(false)
    }
  }
  async function checkAllLayouts(arr: EleBlock[]) {
    if (!baboon || !session?.accessToken) {
      throw new Error(`Missing prerequisites: ${!baboon ? 'baboon-client' : 'accessToken'} is missing`)
    }

    const results: EleBlock[] = []
    for (const _layout of arr) {
      const response = await baboon.renderArticle({
        articleUuid: ydoc.id,
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
    }

    return results
  }

  const statusChecker = async () => {
    try {
      await snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)

      setIsChecking(true)
      const newLayouts = await checkAllLayouts(layouts)

      setLayouts(newLayouts || [])
      setIsChecking(false)
    } catch (ex) {
      setIsChecking(false)
      toast.error(ex instanceof Error ? ex.message : 'Något gick fel när layouterna skulle kontrolleras')
    }
  }

  return (
    <>
      <EditorHeader ydoc={ydoc} flowName={flowName} />
      <Notes ydoc={ydoc} />
      <View.Content className='flex flex-col max-w-[1400px] grow'>
        <section className='flex flex-col-reverse @4xl:grid @4xl:grid-cols-12 @container'>
          <div className='@4xl:col-span-8'>
            <ScrollArea className='h-[calc(100vh-7rem)]'>
              <div className='flex-grow overflow-auto pr-12 max-w-screen-2xl'>
                {!!ydoc.provider && ydoc.provider.isSynced
                  ? (
                      <EditorContent ydoc={ydoc} />
                    )
                  : (
                      <></>
                    )}
              </div>
            </ScrollArea>
          </div>
          <aside className='@4xl:col-span-4 @4xl:sticky @4xl:top-16 p-4'>
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
                  setPromptIsOpen(false)

                  snapshotDocument(ydoc.id, undefined, ydoc.provider?.document)
                    .then(() => {
                      void handleCopyArticle()
                    })
                    .catch((ex: Error) => {
                      toast.error(ex instanceof Error ? ex.message : 'Något gick fel när printartikel skulle dupliceras')
                    })
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
                            ydoc={ydoc}
                            layoutIdForRender={layout.id}
                            layoutId={layout.links['_'][0].uuid}
                            index={index}
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


function EditorContent({ ydoc }: {
  ydoc: YDocument<Y.Map<unknown>>
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')

  const yjsEditor = useYjsEditor(ydoc)
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
