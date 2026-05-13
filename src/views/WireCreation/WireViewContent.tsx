import {
  ViewHeader,
  Awareness,
  Section,
  View,
  Newsvalue
} from '@/components'
import type { ViewProps } from '@/types'
import type { DefaultValueOption } from '@ttab/elephant-ui'
import { Button, Checkbox, ComboBox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'
import {
  CircleXIcon,
  TagsIcon,
  GanttChartSquareIcon,
  CableIcon,
  BriefcaseBusinessIcon,
  TagIcon
} from '@ttab/elephant-ui/icons'
import { useRegistry, useSections, useHasUnit, useUserPreferences } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { JSX } from 'react'
import { Fragment, useMemo, useRef, useState } from 'react'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch as fetchPlannings } from '@/lib/index/fetch-plannings-twirp'
import { createArticle } from './lib/createArticle'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import type * as Y from 'yjs'
import { CreatePrompt } from '@/components/CreatePrompt'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { toSlateYXmlText } from '@/shared/yUtils'
import { useYDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks/useYValue'
import { TextInput } from '@/components/ui/TextInput'
import type { EleDocument, EleDocumentResponse } from '@/shared/types'
import { ValidateNow } from '@/components/ValidateNow'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import useSWR from 'swr'
import { ClockIcon } from '@ttab/elephant-ui/icons'

const BASE_URL = import.meta.env.BASE_URL || ''

const wireDocFetcher = async (url: string): Promise<EleDocument | undefined> => {
  const response = await fetch(url)
  if (!response.ok) {
    return undefined
  }
  const result = await response.json() as EleDocumentResponse
  return result.document
}

export const WireViewContent = (props: ViewProps & {
  /** Throwaway Y.Doc id backing the dialog form (title/slugline/awareness). */
  documentId: string
  /** The eventual article's UUID. Never opened in Hocuspocus during the dialog. */
  articleId: string
  data?: EleDocumentResponse
  wires: WireType[]
}): JSX.Element | undefined => {
  // Form-state Y.Doc only: the article is created via repository.saveDocument
  // in createArticle, never via this Y.Doc.
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })
  const { status, data: session } = useSession()

  // Fetch the first wire document to get embargo and content sources
  const primaryWireId = props.wires?.[0]?.id
  const { data: wireDocument } = useSWR<EleDocument | undefined>(
    primaryWireId ? `${BASE_URL}/api/documents/${primaryWireId}?direct=true` : null,
    wireDocFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const wireData = useMemo(() => {
    if (!wireDocument) {
      return { embargoUntil: undefined, contentSources: undefined }
    }

    const embargoUntil = wireDocument.meta?.['tt/wire']?.[0]?.data?.embargo_until as string | undefined
    const contentSources = wireDocument.links?.['core/content-source']

    return { embargoUntil, contentSources }
  }, [wireDocument])

  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [searchOlder, setSearchOlder] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption & { payload: { slugline?: string, sluglines?: string[], newsvalue?: string, sectionUuid: string, sectionTitle: string } } | undefined>(undefined)
  const [title] = useYValue<Y.XmlText>(ydoc.ele, 'root.title', true)
  const documentAwareness = useRef<(value: boolean) => void>(null)
  const planningTitleRef = useRef<HTMLInputElement>(null)
  const { index, locale, timeZone, server, repository } = useRegistry()
  const sections = useSections()
  const [section, setSection] = useState<{
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined>(undefined)
  const [slugline, setSlugline] = useYValue<Y.XmlText>(ydoc.ele, 'meta.tt/slugline[0].value', true)
  const { t } = useTranslation('wires')
  const [, setNewsvalue] = useYValue<string | undefined>(ydoc.ele, 'meta.core/newsvalue[0].value')
  const isNpkUser = useHasUnit('/redaktionen-npk')
  const { preferences } = useUserPreferences()
  const [translationMode, setTranslationMode] = useState<'none' | 'standard' | 'personal'>(isNpkUser ? 'standard' : 'none')
  const wireHeadline = props.wires?.[0]?.fields['document.title']?.values?.[0] || ''

  const handleSubmit = (): void => {
    setShowVerifyDialog(true)
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <ViewHeader.Root>
        <ViewHeader.Content>
          {props.asDialog && (
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title
                name='Wires'
                title={t('creation.title')}
                icon={CableIcon}
                iconColor='#FF6347'
                asDialog={props.asDialog}
              />
            </div>
          )}
        </ViewHeader.Content>

        <ViewHeader.Action onDialogClose={props.onDialogClose} asDialog={props.asDialog}>
          {!props.asDialog && !!ydoc && <ViewHeader.RemoteUsers ydoc={ydoc} />}
        </ViewHeader.Action>
      </ViewHeader.Root>

      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          {!!selectedPlanning && <ValidateNow />}
          <Form.Content>
            <Form.Group icon={CableIcon}>
              <>
                <Input
                  className='pl-0 pt-2 h-8 text-medium font-semibold border-0 truncate'
                  readOnly
                  value={props.wires?.[0]?.fields['document.title'].values?.[0]}
                />
              </>
            </Form.Group>

            {props.wires?.length > 1 && (
              <div className='flex flex-col gap-0.5 -mt-6 ms-10.5'>
                {props.wires?.map((wire, index) => (
                  <Fragment key={wire.id}>
                    {!!index
                      && (
                        <div className='pl-0 pt-2 text-xs'>
                          {wire.fields['document.title'].values?.[0]}
                        </div>
                      )}
                  </Fragment>
                ))}
              </div>
            )}

            {!!wireData.embargoUntil && (
              <Form.Group icon={ClockIcon}>
                <div className='flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400'>
                  <span className='font-medium'>
                    {t('creation.embargo')}
                    {': '}
                  </span>
                  <span>{new Date(wireData.embargoUntil).toLocaleString(locale.code.full)}</span>
                </div>
              </Form.Group>
            )}

            <Form.Group icon={GanttChartSquareIcon}>
              <Awareness path='wirePlanningItem' ref={documentAwareness} ydoc={ydoc}>
                <ComboBox
                  max={1}
                  size='xs'
                  modal={props.asDialog}
                  className='min-w-0 w-full truncate justify-start max-w-48'
                  selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                  placeholder={t('creation.selectPlanning')}
                  onOpenChange={(isOpen: boolean) => {
                    if (documentAwareness?.current) {
                      documentAwareness.current(isOpen)
                    }
                  }}
                  fetch={(query) => fetchPlannings(query, session, t, index, locale, timeZone, {
                    searchOlder,
                    sluglines: true
                  })}
                  minSearchChars={2}
                  onSelect={(option) => {
                    if (setSelectedPlanning) {
                      const slugline = (option.payload as { slugline: string | undefined }).slugline
                      const sluglines = (option.payload as { sluglines: string[] | undefined }).sluglines

                      if (option.value !== selectedPlanning?.value) {
                        const newsvalue = (option.payload as { newsvalue: string | undefined }).newsvalue
                        const sectionUuid = (option.payload as { section: string | undefined }).section
                        const sectionTitle = sections.find((value) => value.id === sectionUuid)?.title

                        if (!sectionUuid || !sectionTitle) {
                          console.error('Selected planning is missing section data, cannot create article')
                          toast.error('Vald planering saknar sektion och kan inte användas.', {
                            duration: Infinity,
                            closeButton: true
                          })
                          return
                        }

                        setSelectedPlanning({
                          value: option.value,
                          label: option.label,
                          payload: {
                            slugline,
                            sluglines,
                            newsvalue,
                            sectionUuid,
                            sectionTitle
                          }
                        })

                        setSlugline(toSlateYXmlText(slugline || ''))
                        setNewsvalue(newsvalue || undefined)
                      } else {
                        setSelectedPlanning(undefined)
                      }
                    }
                  }}
                >
                </ComboBox>
              </Awareness>

              {!!selectedPlanning && (
                <>
                  <Button
                    variant='ghost'
                    asChild
                    className='text-muted-foreground flex size-4 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                    onClick={(e) => {
                      e.preventDefault()
                      if (setSelectedPlanning) {
                        setSelectedPlanning(undefined)
                      }
                    }}
                  >
                    <CircleXIcon size={18} strokeWidth={1.75} />
                  </Button>
                </>
              )}
              <>
                <Checkbox
                  id='SearchOlder'
                  defaultChecked={searchOlder}
                  onCheckedChange={(checked: boolean) => { setSearchOlder(checked) }}
                />
                <Label htmlFor='SearchOlder' className='text-muted-foreground'>{t('creation.showOlder')}</Label>
              </>
            </Form.Group>


            {!selectedPlanning && (
              <Form.Group icon={TagsIcon}>
                <Section ydoc={ydoc} path='links.core/section[0]' onSelect={setSection} />
                <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />
              </Form.Group>
            )}

            {!selectedPlanning && (
              <Form.Group icon={GanttChartSquareIcon}>
                <>
                  <Input
                    className='pt-2 h-7 text-medium placeholder:text-[#5D709F] placeholder-shown:border-[#5D709F]'
                    placeholder={t('creation.planningTitle')}
                    defaultValue={isNpkUser ? wireHeadline : undefined}
                    ref={planningTitleRef}
                  />
                </>
              </Form.Group>
            )}

            <Form.Group icon={BriefcaseBusinessIcon}>
              <TextInput
                ydoc={ydoc}
                value={title}
                label={t('creation.articleTitle')}
                placeholder={t('creation.assignmentTitle')}
              />
            </Form.Group>

            <Form.Group icon={TagIcon}>
              {selectedPlanning && (
                <SluglineEditable
                  key={selectedPlanning?.value}
                  ydoc={ydoc}
                  value={slugline}
                  compareValues={[
                    ...(selectedPlanning?.payload?.sluglines || []),
                    slugline?.toString()
                  ]}
                />
              )}

              {!selectedPlanning && (
                <SluglineEditable
                  ydoc={ydoc}
                  value={slugline}
                />
              )}
            </Form.Group>

            {isNpkUser && (
              <Form.Group icon={CableIcon}>
                <Label className='text-muted-foreground text-sm'>
                  {t('creation.translateToNynorsk')}
                </Label>
                <Select
                  value={translationMode}
                  onValueChange={(value: string) => { setTranslationMode(value as 'none' | 'standard' | 'personal') }}
                >
                  <SelectTrigger className='h-7 w-auto min-w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>{t('creation.translationNone')}</SelectItem>
                    <SelectItem value='standard'>{t('creation.translationStandard')}</SelectItem>
                    <SelectItem value='personal'>{t('creation.translationPersonal')}</SelectItem>
                  </SelectContent>
                </Select>
              </Form.Group>
            )}

            <>
              <UserMessage asDialog={!!props?.asDialog}>
                {!selectedPlanning
                  ? (<>{t('creation.noPlanningHint')}</>)
                  : (<>{t('creation.withPlanningHint')}</>)}
              </UserMessage>
            </>

          </Form.Content>

          {showVerifyDialog
            && (
              <CreatePrompt
                title={t('creation.dialogTitle')}
                description={!selectedPlanning
                  ? t('creation.dialogNoPlanningDescription')
                  : t('creation.dialogWithPlanningDescription', { planningLabel: selectedPlanning.label })}
                secondaryLabel={t('common:actions.abort')}
                primaryLabel={t('common:actions.create')}
                onPrimary={() => {
                  const effectiveSection = selectedPlanning?.value
                    ? { uuid: selectedPlanning.payload.sectionUuid, title: selectedPlanning.payload.sectionTitle }
                    : section

                  if (!ydoc.connected || !ydoc.id || !session || !effectiveSection?.uuid) {
                    console.error('Environment is not sane, article cannot be created')
                    return
                  }

                  // Keep both the CreatePrompt and the main dialog open until
                  // createArticle has fully landed (article saved AND linked to
                  // planning). The CreatePrompt's built-in `isSubmitting` state
                  // disables the primary button and shows a spinner during the
                  // wait, so the user can't navigate away to a planning that
                  // briefly references an article whose creation is still in
                  // flight. Belt-and-braces alongside the save-then-link order
                  // in createArticle.
                  createArticle({
                    ydoc,
                    articleId: props.articleId,
                    repository,
                    status,
                    session,
                    planningId: selectedPlanning?.value,
                    planningTitle: planningTitleRef.current?.value,
                    newsvalue: selectedPlanning?.payload?.newsvalue,
                    wires: props.wires,
                    section: effectiveSection,
                    timeZone,
                    embargoUntil: wireData.embargoUntil,
                    contentSources: wireData.contentSources,
                    wireContent: wireDocument?.content,
                    translationMode: translationMode !== 'none' ? translationMode : undefined,
                    personalPrefs: preferences.nynorskPrefs,
                    ntbUrl: server.ntbUrl?.href
                  })
                    .then(() => {
                      setShowVerifyDialog(false)
                      if (props?.onDialogClose) {
                        props.onDialogClose(ydoc.id)
                      }
                      props.onDocumentCreated?.()
                    })
                    .catch((ex: unknown) => {
                      // Close the CreatePrompt so the user can retry or cancel
                      // — without this the prompt's `isSubmitting` would lock
                      // the primary button forever.
                      setShowVerifyDialog(false)
                      if (ex instanceof Error && ex.message === 'CreateAssignmentError') {
                        // Toast already shown by addAssignmentWithDeliverable
                      } else if (ex instanceof Error && ex.message === 'TranslationError') {
                        // Translation-specific toast already shown by createArticle
                      } else {
                        toast.error(t('creation.createError'))
                      }
                    })
                }}
                onSecondary={() => {
                  setShowVerifyDialog(false)
                }}
              />
            )}

          <Form.Footer className='flex justify-between flex-row-reverse'>
            <Form.Submit onSubmit={handleSubmit}>
              <Button type='submit'>{t('creation.title')}</Button>
            </Form.Submit>
          </Form.Footer>
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
