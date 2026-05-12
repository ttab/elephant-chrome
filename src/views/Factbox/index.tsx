import { useQuery, useRegistry, useRepositoryEvents } from '@/hooks'
import { type ViewProps, type ViewMetadata } from '@/types/index'
import type * as Y from 'yjs'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks, Link } from '@ttab/textbit-plugins'
import { Textbit } from '@ttab/textbit'
import { useSession } from 'next-auth/react'
import { getValueByYPath } from '@/shared/yUtils'
import { Form, UserMessage, View } from '@/components'
import { FactboxHeader } from './FactboxHeader'
import { Error as ErrorView } from '@/views/Error'
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react'
import { LinkedArticles } from './lib/LinkedArticles'
import { getContentMenuLabels } from '@/defaults/contentMenuLabels'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import type { EleDocumentResponse } from '@/shared/types'
import type { Document } from '@ttab/elephant-api/newsdoc'
import { BaseEditor } from '@/components/Editor/BaseEditor'
import { TextInput } from '@/components/ui/TextInput'
import { cn } from '@ttab/elephant-ui/utils'
import { DocumentHistory } from '@/components/DocumentHistory/DocumentHistory'
import { type DocumentState, getDocumentState } from '@/lib/getDocumentState'
import { Editor as PlainEditor } from '@/components/PlainEditor'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BoxesIcon, FileLockIcon, LoaderIcon } from '@ttab/elephant-ui/icons'
import { Link as TextLink } from '@/components'
import { useLink } from '@/hooks/useLink'
import { createNewFactbox } from '@/components/Header/lib/createNewFactbox'

const BASE_URL = import.meta.env.BASE_URL || ''
const meta: ViewMetadata = {
  name: 'Factbox',
  path: `${import.meta.env.BASE_URL || ''}/factbox`,
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
  const documentId = embeddedMatch ? articleId : query?.id || rawId

  // If this is an embedded factbox, fetch the article and extract the factbox block
  useEffect(() => {
    if (!articleId || embeddedIndex === null || !repository || !session?.accessToken) {
      return
    }

    void repository.getDocument({ uuid: articleId, accessToken: session.accessToken }).then((response) => {
      if (!response?.document) {
        toast.error(t('errors:toasts.couldNotOpenEmbeddedFactbox'))
        return
      }
      const factboxBlocks = response.document.content.filter((block) => block.type === 'core/factbox')
      const block = factboxBlocks[embeddedIndex]

      if (!block) {
        return
      }

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
    }).catch((error) => {
      console.error('Error fetching document for embedded factbox:', error)
      toast.error(t('errors:toasts.couldNotOpenEmbeddedFactbox'))
    })
  }, [articleId, embeddedIndex, repository, session?.accessToken, t])

  // Standalone factbox: build data from props.document if provided
  const standaloneData = (!embeddedMatch && props.document && documentId && typeof documentId === 'string')
    ? toGroupedNewsDoc({
      version: 0n,
      isMetaDocument: false,
      mainDocument: '',
      subset: [],
      document: props.document
    })
    : undefined

  // Error handling for missing document
  if (!documentId || typeof documentId !== 'string') {
    return (
      <ErrorView
        title={t('errors:messages.documentTypeMissing', { documentType: t('core:documentType.factbox') })}
        message={t('errors:messages.documentTypeMissingDescription', { documentType: t('factbox:factboxDocument') })}
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
  const { t } = useTranslation('factbox')
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const openFactbox = useLink('Factbox')
  const [isOpeningOriginal, setIsOpeningOriginal] = useState(false)
  const configuredPlugins = useMemo(() => [
    UnorderedList(),
    OrderedList(),
    Bold(),
    Italic(),
    LocalizedQuotationMarks(),
    Text({ ...getContentMenuLabels() })
  ], [])

  const handleOpenOriginal = async (event: React.MouseEvent) => {
    event.preventDefault()
    if (!originalId || isOpeningOriginal) return

    setIsOpeningOriginal(true)
    try {
      const response = await fetch(`${BASE_URL}/api/documents/${originalId}`)

      if (!response.ok) {
        if (!props.data) {
          throw new Error('Embedded factbox data is not available')
        }

        const { document } = fromGroupedNewsDoc(props.data)

        const newDocument: Document = {
          ...document,
          uuid: originalId,
          uri: `core://factbox/${originalId}`
        }

        createNewFactbox(repository, session, originalId, newDocument)
          .then((id) => {
            openFactbox(undefined, { id }, undefined)
          })
          .catch((error: unknown) => {
            console.error('Error creating factbox:', error)
            toast.error((error as Error).message)
          })
        return
      }

      if (response.ok) {
        openFactbox(undefined, { id: originalId }, undefined)
      }
    } catch (error) {
      console.error('Error opening original factbox:', error)
      toast.error((error as Error).message)
    } finally {
      setIsOpeningOriginal(false)
    }
  }

  if (!props.data?.document) {
    return (
      <View.Root asDialog={props.asDialog} className={props.className}>
        <div className='flex h-full w-full items-center justify-center'>
          <LoaderIcon size={32} strokeWidth={1.75} className='animate-spin opacity-50' />
        </div>
      </View.Root>
    )
  }

  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <FactboxHeader
        onDialogClose={props.onDialogClose}
        asDialog={!!props?.asDialog}
      />
      <div className='flex-1 min-h-0 flex flex-col w-full max-w-[1000px] mx-auto'>
        <View.Content className='flex flex-col max-w-[1000px]'>
          <div className='flex flex-col gap-1.5 text-sm text-muted-foreground border-b p-4'>

            <div className='flex gap-1.5'>
              <FileLockIcon strokeWidth={1.75} size={16} className='mr-0.5' />
              <span>
                {t('fromPublished')}
              </span>
              <TextLink
                to='Editor'
                props={{ id: articleId }}
                className='underline hover:text-foreground'
              >
                {t('article')}
              </TextLink>
            </div>
            <div className='flex gap-1.5'>
              <BoxesIcon strokeWidth={1.75} size={16} className='mr-0.5' />

              <span>
                {t('action.open')}
              </span>
              <button
                type='button'
                onClick={(event) => void handleOpenOriginal(event)}
                disabled={isOpeningOriginal || !originalId}
                className='underline hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50'
              >
                {t('original')}
                {isOpeningOriginal && (
                  <LoaderIcon size={12} strokeWidth={1.75} className='animate-spin opacity-70' />
                )}
              </button>
            </div>
          </div>
          <p className={cn('text-lg font-bold pt-2 ps-12 pe-12')}>
            {props.data.document.title}
          </p>

          <Textbit.Root
            value={props.data.document.content}
            plugins={configuredPlugins}
            readOnly
            className='h-full flex flex-col'
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
  const [statusRefetchKey, setStatusRefetchKey] = useState(0)
  const environmentIsSane = ydoc.provider && status === 'authenticated'

  const eventTypes = useMemo(() => ['core/factbox', 'core/factbox+meta'], [])

  const handleRepositoryEvent = useCallback(
    (event: { uuid?: string, mainDocument?: string }) => {
      if (event.uuid === props.documentId || event.mainDocument === props.documentId) {
        setStatusRefetchKey((k) => k + 1)
      }
    },
    [props.documentId]
  )

  useRepositoryEvents(eventTypes, handleRepositoryEvent)

  useEffect(() => {
    if (!repository || !session?.accessToken) return

    let cancelled = false

    void (async () => {
      try {
        const res = await repository.getStatuses({
          uuids: [props.documentId],
          statuses: ['usable', 'draft', 'unpublished'],
          accessToken: session.accessToken
        })
        if (cancelled) return
        const item = res?.items[0]
        if (item) {
          setCurrentVersion(item.version)
          setDocumentState(getDocumentState(item))
        }
      } catch (error) {
        if (cancelled) return
        console.error(error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [repository, session?.accessToken, props.documentId, statusRefetchKey])

  const { t } = useTranslation('core')
  const configuredPlugins = useMemo(() => {
    return [
      UnorderedList(),
      Link(),
      OrderedList(),
      Bold(),
      Italic(),
      LocalizedQuotationMarks(),
      Text({ ...getContentMenuLabels() })
    ]
  }, [])

  const isOldVersion = factboxversion !== undefined && factboxversion !== currentVersion

  if (!ydoc.provider?.isSynced || !content) {
    return (
      <View.Root asDialog={props.asDialog} className={props.className}>
        <div className='flex h-full w-full items-center justify-center'>
          <LoaderIcon size={32} strokeWidth={1.75} className='animate-spin opacity-50' />
        </div>
      </View.Root>
    )
  }
  return (
    <View.Root asDialog={props.asDialog} className={props?.className}>
      <FactboxHeader
        ydoc={ydoc}
        onDialogClose={props.onDialogClose}
        asDialog={!!props?.asDialog}
      />
      <div className='flex-1 min-h-0 flex flex-col w-full max-w-[1000px] mx-auto'>
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
              <View.Content className='flex flex-col max-w-[1000px] pt-8' variant='default'>
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
                className='flex-1 min-h-0'
              >
                <View.Content className='flex flex-col' variant='default'>
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
                  <LinkedArticles documentId={props.documentId} />
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
