import { useMemo, type JSX } from 'react'
import { useTextbit } from '@ttab/textbit'
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
  useRegistry
} from '@/hooks'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './PrintEditorHeader'
import { Error as ErrorView } from '../Error'

import { Notes } from '@/components/Notes'

import { getValueByYPath } from '@/shared/yUtils'
import { contentMenuLabels } from '@/defaults/contentMenuLabels'
import { ScrollArea } from '@ttab/elephant-ui'
import { Layouts } from './components/Layouts'
import { useSession } from 'next-auth/react'
import type * as Y from 'yjs'
import { ImagePlugin } from './ImagePlugin'
import { ChannelComboBox } from './components/ChannelComboBox'
import { useYDocument, useYValue, type YDocument } from '@/modules/yjs/hooks'
import { View } from '@/components/View'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { useTranslation } from 'react-i18next'

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
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    ignoreChangeKeys: ['meta.tt/print-article[0].meta.tt/article-layout[*].data.status']
  })
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)

  const { data } = useSession()
  const { repository } = useRegistry()
  const openFactboxEditor = useLink('Factbox')
  const openImageSearch = useLink('ImageSearch')
  const openFactboxes = useLink('Factboxes')
  const { t, i18n } = useTranslation()

  const activeLanguage = i18n.resolvedLanguage

  // Plugin configuration
  const configuredPlugins = useMemo(() => {
    return [
      Bold(),
      Italic(),
      ImageSearchPlugin({ openImageSearch }),
      FactboxPlugin({ openFactboxes }),
      Table(),
      LocalizedQuotationMarks(),
      PrintText(),
      Text({
        countCharacters: ['heading-1'],
        ...contentMenuLabels
      }),
      ImagePlugin({
        repository,
        accessToken: data?.accessToken || ''
      }),
      TVListing({
        channelComponent: () => ChannelComboBox()
      }),
      TTVisual({
        captionLabel: t('editor:image.captionLabel'),
        bylineLabel: t('editor:image.bylineLabel'),
        enableCrop: true
      }),
      Factbox({
        headerTitle: t('editor:factbox.headerTitle'),
        modifiedLabel: t('editor:factbox.modifiedLabel'),
        footerTitle: t('editor:factbox.footerTitle'),
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        },
        removable: true,
        locale: activeLanguage,
        ...contentMenuLabels
      })
    ]
  }, [openFactboxEditor, data, repository, openFactboxes, openImageSearch, t, activeLanguage])

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        plugins={configuredPlugins}
        lang={documentLanguage}
      >
        <EditorContainer ydoc={ydoc} />
      </BaseEditor.Root>
    </View.Root>
  )
}


// Container component that uses TextBit context
function EditorContainer({ ydoc }: {
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
                  ? <BaseEditor.Text ydoc={ydoc} autoFocus={true} />
                  : null}
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

PrintEditor.meta = meta

export { PrintEditor }
