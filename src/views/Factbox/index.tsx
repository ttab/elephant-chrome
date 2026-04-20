import { useQuery, useRegistry } from '@/hooks'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import { Textbit } from '@ttab/textbit'
import { useSession } from 'next-auth/react'
import { getValueByYPath } from '@/shared/yUtils'
import { Form, UserMessage, View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error as ErrorView } from '@/views/Error'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { getContentMenuLabels } from '@/defaults/contentMenuLabels'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { getTemplateFromView } from '@/shared/templates/lib/getTemplateFromView'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { TextInput } from '@/components/ui/TextInput'
import { cn } from '@ttab/elephant-ui/utils'
import { DocumentHistory } from '@/components/DocumentHistory/DocumentHistory'
import { type DocumentState, getDocumentState } from '@/lib/getDocumentState'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { useTranslation } from 'react-i18next'
const meta: ViewMetadata = {
  name: 'Factbox',
  path: `${import.meta.env.BASE_URL || ''}/factbox`,
  widths: {
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 4,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

const Factbox = (props: ViewProps & { document?: Document }): JSX.Element => {
  const [query] = useQuery()
  const rawId = props.id || query.id
  const { t } = useTranslation('common')
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const [embeddedData, setEmbeddedData] = useState<EleDocumentResponse | undefined>(undefined)

  // Parse embedded id: "articleId:embedded:index"
  const embeddedMatch = typeof rawId === 'string' ? rawId.match(/^(.+):embedded:(\d+)$/) : null
  const articleId = embeddedMatch?.[1]
  const embeddedIndex = embeddedMatch ? parseInt(embeddedMatch[2]) : null
  const documentId = embeddedMatch ? articleId : rawId
  // If this is an embedded factbox, fetch the article and extract the factbox block
  useEffect(() => {
    if (!articleId || embeddedIndex === null || !repository || !session?.accessToken) return

    void repository.getDocument({ uuid: articleId, accessToken: session.accessToken }).then((response) => {
      if (!response?.document) return
      console.log(response)
      const factboxBlocks = response.document.content.filter((block) => block.type === 'core/factbox')
      const block = factboxBlocks[embeddedIndex]

      if (!block) return

      setEmbeddedData(toGroupedNewsDoc({
        version: response.version,
        isMetaDocument: false,
        mainDocument: '',
        subset: [],
        document: {
          ...response.document,
          uuid: articleId,
          type: 'core/factbox',
          title: block.title,
          content: block.content,
          meta: block.meta,
          links: block.links
        }
      }))
    })
  }, [articleId, embeddedIndex, repository, session?.accessToken])

  // Standalone factbox: build data from props.document if provided
  const standaloneData = useMemo(() => {
    if (embeddedMatch || !props.document || !documentId || typeof documentId !== 'string') {
      return undefined
    }
    return toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      subset: [],
      document: props.document || getTemplateFromView('Factbox')(documentId)
    })
  }, [documentId, props.document, embeddedMatch])

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <ErrorView
        title={t('errors:messages.articleMissingTitle')}
        message={t('errors:messages.articleMissingDescription')}
      />
    )
  }

  // Embedded factboxes are read-only — display without a YJS/HocusPocus connection
  if (embeddedMatch) {
    return <EmbeddedFactboxView {...props} data={embeddedData} />
  }

  return (
    <FactboxWrapper {...props} documentId={documentId} data={standaloneData} />
  )
}

const EmbeddedFactboxView = (props: ViewProps & { data?: EleDocumentResponse }): JSX.Element => {
  const articleId = props?.data?.document?.uuid
  const originalId = props.data?.document?.links._?.[0]?.uuid
  const configuredPlugins = useMemo(() => [
    UnorderedList(),
    OrderedList(),
    Bold(),
    Italic(),
    LocalizedQuotationMarks(),
    Text({ ...getContentMenuLabels() })
  ], [])

  if (!props.data?.document) {
    return <View.Root />
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <FactboxHeader
        onDialogClose={props.onDialogClose}
        asDialog={!!props?.asDialog}
        articleId={articleId}
        originalId={originalId}
      />
      <div className='flex flex-col w-full max-w-[1000px] mx-auto'>
        <View.Content className='flex flex-col max-w-[1000px]'>
          <p className={cn('text-lg font-bold pt-2 ps-12 pe-12')}>
            {props.data.document.title}
          </p>

          <Textbit.Root
            value={props.data.document.content}
            plugins={configuredPlugins}
            readOnly
            className='h-screen max-h-screen flex flex-col'
          >
            <Textbit.Editable
              className='outline-none pt-4 pb-4 ps-12 pe-12 dark:text-slate-100 grow pr-12 max-w-(--breakpoint-xl)'
            />
          </Textbit.Root>
        </View.Content>
      </div>
    </View.Root>
  )
}

const FactboxWrapper = (props: ViewProps & { documentId: string, data?: EleDocumentResponse }): JSX.Element => {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const [content] = getValueByYPath<Y.XmlText>(ydoc.ele, 'content', true)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')
  const { repository } = useRegistry()
  const { data: session, status } = useSession()
  const [factboxversion, setFactboxVersion] = useState<bigint | undefined>(undefined)
  const [documentState, setDocumentState] = useState<DocumentState | undefined>(undefined)
  const [currentVersion, setCurrentVersion] = useState<bigint | undefined>(undefined)
  const environmentIsSane = ydoc.provider && status === 'authenticated'

  useEffect(() => {
    if (!repository || !session?.accessToken) return
    void repository.getStatuses({
      uuids: [props.documentId],
      statuses: ['usable', 'draft', 'unpublished'],
      accessToken: session.accessToken
    }).then((res) => {
      const item = res?.items[0]
      if (item) {
        setCurrentVersion(item.version)
        setDocumentState(getDocumentState(item))
      }
    })
  }, [repository, session?.accessToken, props.documentId])

  const { t } = useTranslation('core')
  const configuredPlugins = useMemo(() => {
    return [
      UnorderedList(),
      OrderedList(),
      Bold(),
      Italic(),
      LocalizedQuotationMarks(),
      Text({ ...getContentMenuLabels() })
    ]
  }, [])

  const isOldVersion = factboxversion !== undefined && factboxversion !== currentVersion

  if (!ydoc.provider?.isSynced || !content) {
    return <View.Root />
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <FactboxHeader
        ydoc={ydoc}
        onDialogClose={props.onDialogClose}
        asDialog={!!props?.asDialog}
      />
      <div className='flex flex-col w-full max-w-[1000px] mx-auto'>
        <div className='border mx-12 mt-2 py-1.5 px-3 rounded'>
          <DocumentHistory
            uuid={props.documentId}
            currentVersion={currentVersion}
            documentState={documentState}
            onSelectVersion={setFactboxVersion}
            selectedVersion={factboxversion}
            withStatusOnly={true}
            documentType='core/factbox'
          />
        </div>
        {isOldVersion
          ? (
              <View.Content className='flex flex-col max-w-[1000px] pt-8' variant='grid'>
                <PlainEditor
                  key={factboxversion.toString()}
                  id={props.documentId}
                  version={factboxversion}
                  direct
                  showTitle
                />
              </View.Content>
            )
          : (
              <BaseEditor.Root
                ydoc={ydoc}
                content={content}
                lang={documentLanguage}
                plugins={configuredPlugins}
              >
                <View.Content className='flex flex-col max-w-[1000px]'>
                  <Form.Root asDialog={props?.asDialog}>
                    <Form.Content>
                      <Form.Title>
                        <TextInput
                          ydoc={ydoc}
                          value={title}
                          className={cn(
                            !props.asDialog ? 'ms-3.25' : 'ms-6 me-5'
                          )}
                          label={t('labels.title')}
                          placeholder={t('labels.title')}
                          autoFocus='end'
                        />
                      </Form.Title>
                    </Form.Content>
                  </Form.Root>

                  <div className='flex flex-col gap-4 mb-4 grow'>
                    <BaseEditor.Text
                      ydoc={ydoc}
                      editorType='factbox'
                    />

                    <div className='mx-12'>
                      {!environmentIsSane && (
                        <UserMessage asDialog={!!props?.asDialog} variant='destructive'>
                          {t('errors:messages.unwellEnvironment')}
                        </UserMessage>
                      )}
                    </div>
                  </div>
                </View.Content>

                <View.Footer>
                  <BaseEditor.Footer />
                </View.Footer>
              </BaseEditor.Root>
            )}
      </div>
    </View.Root>
  )
}

Factbox.meta = meta
export { Factbox }
