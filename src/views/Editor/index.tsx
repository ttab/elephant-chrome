import type { JSX } from 'react'
import { useMemo } from 'react'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { View } from '@/components'
import { Notes } from '@/components/Notes'
import {
  Bold,
  Italic,
  Image,
  Link,
  Text,
  TTVisual,
  Factbox,
  Table,
  LocalizedQuotationMarks,
  UnorderedList,
  OrderedList
} from '@ttab/textbit-plugins'
import { ImageSearchPlugin } from '../../plugins/ImageSearch'
import { FactboxPlugin } from '../../plugins/Factboxes'
import { createFactboxConsume } from '../../plugins/Factboxes/consume'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import type { TBConsumeFunction, TBConsumesFunction, TBPluginDefinition } from '@ttab/textbit'
import { useSession } from 'next-auth/react'

type WithConsumer = TBPluginDefinition & {
  consumer?: { consumes: TBConsumesFunction, consume: TBConsumeFunction }
}

import {
  useQuery,
  useLink,
  useRegistry,
  useWorkflowStatus
} from '@/hooks'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import type { ViewMetadata, ViewProps } from '@/types'
import { EditorHeader } from './EditorHeader'
import { Error as ErrorComponent } from '../Error'

import { getValueByYPath } from '@/shared/yUtils'
import { getContentMenuLabels } from '@/defaults/contentMenuLabels'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

// Metadata definition
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

// Main Editor Component - Handles document initialization
const Editor = (props: ViewProps): JSX.Element => {
  const [query] = useQuery()
  const { t } = useTranslation('common')
  const documentId = props.id || query.id as string
  const preview = query.preview === 'true'

  const [workflowStatus] = useWorkflowStatus({ documentId })

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <ErrorComponent
        title={t('errors:messages.articleMissingTitle')}
        message={t('errors:messages.articleMissingDescription')}
      />
    )
  }

  // If published, used, or a specific version is requested — render read-only.
  const isTerminalStatus = workflowStatus?.name === 'usable'
    || workflowStatus?.name === 'unpublished'
    || workflowStatus?.name === 'used'

  if (isTerminalStatus || props.version) {
    const bigIntVersion = workflowStatus?.name === 'usable' || workflowStatus?.name === 'used'
      ? workflowStatus?.version
      : BigInt(props.version ?? 0)

    return (
      <View.Root>
        <EditorHeader
          ydoc={{ id: documentId } as YDocument<Y.Map<unknown>>}
          readOnly
          readOnlyVersion={bigIntVersion}
        />
        <View.Content className='flex flex-col max-w-[1000px] px-4 h-full' variant='grid'>
          <PlainEditor key={props.version} id={documentId} version={bigIntVersion} />
        </View.Content>
      </View.Root>
    )
  }

  return (
    <EditorWrapper
      {...props}
      preview={preview}
      documentId={documentId}
    />
  )
}

// Main editor wrapper after document initialization
function EditorWrapper(props: ViewProps & {
  documentId: string
  planningId?: string | null
  preview?: boolean
}): JSX.Element {
  const { preview, planningId } = props

  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    visibility: !preview
  })
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [hast] = getValueByYPath<Block | undefined>(ydoc.ele, 'meta.ntb/hast[0]')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const openFactboxEditor = useLink('Factbox')
  const openImageSearch = useLink('ImageSearch')
  const openFactboxes = useLink('Factboxes')
  const { t, i18n } = useTranslation()
  const { repository } = useRegistry()
  const { hasVignette } = useFeatureFlags(['hasVignette'])
  const { data: session } = useSession()

  const activeLocale = i18n.resolvedLanguage

  // Plugin configuration
  const configuredPlugins = useMemo(() => {
    return [
      Bold(),
      Italic(),
      Link(),
      ImageSearchPlugin({ openImageSearch }),
      FactboxPlugin({ openFactboxes }),
      Table(),
      LocalizedQuotationMarks(),
      OrderedList(),
      UnorderedList(),
      TTVisual({
        captionLabel: t('editor:image.captionLabel'),
        bylineLabel: t('editor:image.bylineLabel'),
        enableCrop: false,
        removable: !preview
      }),
      Image({
        removable: true,
        enableCrop: false,
        visibility: () => [false, true, false]
      }),
      Text({
        countCharacters: hast ? ['heading-1', 'preamble'] : ['heading-1'],
        hasVignette: hasVignette,
        ...getContentMenuLabels()
      }),
      (() => {
        const plugin = Factbox({
          headerTitle: t('editor:factbox.headerTitle'),
          modifiedLabel: t('editor:factbox.modifiedLabel'),
          createdLabel: t('editor:factbox.createdLabel'),
          lastModifiedLabel: t('editor:factbox.lastModifiedLabel'),
          footerTitle: t('editor:factbox.footerTitle'),
          onEditOriginal: (id: string) => {
            openFactboxEditor(undefined, { id })
          },
          removable: !preview,
          locale: activeLocale,
          factboxNewTitle: t('editor:factbox.factboxNewTitle'),
          addSingleLabel: t('editor:factbox.addSingleLabel')
        }) as WithConsumer
        return {
          ...plugin,
          consumer: plugin.consumer && {
            ...plugin.consumer,
            consume: createFactboxConsume(repository, session)
          }
        }
      })()
    ]
  }, [openFactboxEditor, openFactboxes, openImageSearch, preview, t, activeLocale, repository, session, hast, hasVignette])

  if (!content) {
    return <View.Root />
  }

  return (
    <View.Root>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        readOnly={preview}
        plugins={configuredPlugins}
        lang={documentLanguage}
      >
        <EditorHeader ydoc={ydoc} planningId={planningId} readOnly={preview} />

        <Notes ydoc={ydoc} />

        <View.Content className='flex flex-col max-w-[1000px]'variant='grid'>
          <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
            <BaseEditor.Text
              ydoc={ydoc}
              autoFocus={true}
            />
          </div>
        </View.Content>

        <View.Footer>
          <BaseEditor.Footer lang={documentLanguage} />
        </View.Footer>
      </BaseEditor.Root>
    </View.Root>
  )
}

Editor.meta = meta

export { Editor }
