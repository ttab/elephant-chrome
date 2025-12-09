import { useEffect, useRef } from 'react'

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
import { ScrollArea } from '@ttab/elephant-ui'
import { Layouts } from './components/Layouts'
import { useSession } from 'next-auth/react'
import type * as Y from 'yjs'
import { ImagePlugin } from './ImagePlugin'
import { ChannelComboBox } from './components/ChannelComboBox'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { View } from '@/components/View'

const meta: ViewMetadata = {
  name: 'PrintEditor',
  path: `${import.meta.env.BASE_URL || ''}/print-editor`,
  widths: {
    sm: 12,
    md: 12,
    lg: 12,
    xl: 6,
    '2xl': 6,
    hd: 6,
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
  const { stats } = useTextbit()
  const [flowName] = useYValue<string>(ydoc.ele, 'links.tt/print-flow[0].title')


  return (
    <>
      <EditorHeader ydoc={ydoc} flowName={flowName} />
      <Notes ydoc={ydoc} />
      <View.Content className='flex flex-col w-full max-w-[1400px] grow'>
        <section className='flex flex-row items-start gap-8 @4xl/view:grid @4xl/view:grid-cols-12 @4xl/view:gap-6'>
          <div className='flex-1 min-w-0 @4xl/view:col-span-8'>
            <ScrollArea className='h-full @4xl/view:h-[calc(100vh-7rem)]'>
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
          <Layouts
            ydoc={ydoc}
          />

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
