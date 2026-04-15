import { useMemo, type JSX } from 'react'
import { View } from '@/components'
import { useQuery } from '@/hooks'
import { Error } from '@/views/Error'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { Document } from '@ttab/elephant-api/newsdoc'
import type { ViewMetadata, ViewProps } from '@/types'
import type { EleDocumentResponse } from '@/shared/types'
import type * as Y from 'yjs'
import { useYDocument } from '@/modules/yjs/hooks'
import { getValueByYPath } from '@/shared/yUtils'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import {
  Bold,
  Italic,
  Image,
  Link,
  Text,
  TTVisual,
  Factbox,
  Table,
  LocalizedQuotationMarks
} from '@ttab/textbit-plugins'
import { getContentMenuLabels } from '@/defaults/contentMenuLabels'
import { TimelessArticleHeader } from './TimelessArticleHeader'
import { useLink } from '@/hooks/useLink'
import { useTranslation } from 'react-i18next'

const meta: ViewMetadata = {
  name: 'TimelessArticle',
  path: `${import.meta.env.BASE_URL || ''}/timeless-article`,
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

export const TimelessArticle = (props: ViewProps & { document?: Document }): JSX.Element => {
  const [query] = useQuery()
  const { t } = useTranslation('common')
  const documentId = props.id || query.id

  const data = useMemo(() => {
    if (!documentId || typeof documentId !== 'string') {
      return undefined
    }

    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      subset: [],
      document: props.document || getTemplateFromView('TimelessArticle')(documentId)
    })
  }, [documentId, props.document])

  if (!documentId || typeof documentId !== 'string') {
    return (
      <Error
        title={t('errors:messages.articleMissingTitle')}
        message={t('errors:messages.articleMissingDescription')}
      />
    )
  }

  return <TimelessArticleWrapper {...props} documentId={documentId} data={data} />
}

TimelessArticle.meta = meta

function TimelessArticleWrapper(props: ViewProps & {
  documentId: string
  data?: EleDocumentResponse
}): JSX.Element {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const openFactboxEditor = useLink('Factbox')
  const { t, i18n } = useTranslation()

  const activeLocale = i18n.resolvedLanguage

  const configuredPlugins = useMemo(() => {
    return [
      Bold(),
      Italic(),
      Link(),
      Table(),
      LocalizedQuotationMarks(),
      TTVisual({
        captionLabel: t('editor:image.captionLabel'),
        bylineLabel: t('editor:image.bylineLabel'),
        enableCrop: false,
        removable: true
      }),
      Image({
        removable: true,
        enableCrop: false,
        visibility: () => [false, true, false]
      }),
      Text({
        countCharacters: ['heading-1'],
        ...getContentMenuLabels()
      }),
      Factbox({
        headerTitle: t('editor:factbox.headerTitle'),
        modifiedLabel: t('editor:factbox.modifiedLabel'),
        footerTitle: t('editor:factbox.footerTitle'),
        onEditOriginal: (id: string) => {
          openFactboxEditor(undefined, { id })
        },
        removable: true,
        locale: activeLocale
      })
    ]
  }, [openFactboxEditor, t, activeLocale])

  if (!ydoc.provider?.isSynced || !content) {
    return <View.Root />
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <BaseEditor.Root
        ydoc={ydoc}
        content={content}
        lang={documentLanguage}
        plugins={configuredPlugins}
      >
        <TimelessArticleHeader
          ydoc={ydoc}
          asDialog={!!props.asDialog}
          onDialogClose={props.onDialogClose}
        />

        <View.Content className='flex flex-col max-w-[1000px] px-4' variant='grid'>
          <div className='grow overflow-auto pr-12 max-w-(--breakpoint-xl)'>
            <BaseEditor.Text ydoc={ydoc} />
          </div>
        </View.Content>
      </BaseEditor.Root>
    </View.Root>
  )
}
