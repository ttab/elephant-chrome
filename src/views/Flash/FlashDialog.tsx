import {
  Awareness,
  Section,
  View
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { Alert, AlertDescription, AlertTitle, Button, Checkbox, ComboBox, Label } from '@ttab/elephant-ui'
import { CircleXIcon, TagsIcon, GanttChartSquareIcon, NewspaperIcon, ZapIcon, InfoIcon } from '@ttab/elephant-ui/icons'
import { useRegistry, useSections } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { Dispatch, SetStateAction } from 'react'
import { type JSX, useMemo, useRef, useState } from 'react'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import type { CreateFlashDocumentStatus } from './lib/createFlash'
import { createFlash } from './lib/createFlash'
import { CreatePrompt } from '@/components/CreatePrompt'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import type { EleDocumentResponse } from '@/shared/types'
import type { QuickArticleData } from '@/shared/types'
import type * as Y from 'yjs'
import { createQuickArticleAfterFlash } from './lib/createQuickArticleAfterFlash'
import { ToastAction } from '@/components/ToastAction'
import { quickArticleDocumentTemplate } from '@/shared/templates/quickArticleDocumentTemplate'
import { DocumentHeader } from '@/components/QuickDocument/DocumentHeader'
import { DialogEditor } from '@/components/QuickDocument/DialogEditor'
import { getLabel, promptConfig } from '@/components/QuickDocument/dialogConfig'
import { useTranslation } from 'react-i18next'

type PromptConfig = {
  visible: boolean
  key: string
  title: string
  description: string
  secondaryDescription?: string
  secondaryLabel: string
  primaryLabel: string
  documentStatus: CreateFlashDocumentStatus
  setPrompt: Dispatch<SetStateAction<boolean>>
}

export const FlashDialog = (props: {
  documentId: string
  data?: EleDocumentResponse
} & ViewProps): JSX.Element => {
  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, { data: props.data })

  const { status, data: session } = useSession()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [sendPrompt, setSendPrompt] = useState(false)
  const [savePrompt, setSavePrompt] = useState(false)
  const [donePrompt, setDonePrompt] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<Omit<DefaultValueOption, 'payload'> & { payload: unknown, label: string } | undefined>(undefined)
  const [, setTitle] = useYValue<string | undefined>(ydoc.ele, 'root.title')
  const { index, locale, timeZone, repository } = useRegistry()
  const [searchOlder, setSearchOlder] = useState(false)
  const [section, setSection] = useState<{
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined>(undefined)
  const readOnly = Number(props?.version) > 0 && !props.asDialog
  const allSections = useSections()
  const [, setYSection] = useYValue<Block | undefined>(ydoc.ele, 'links.core/section[0]')
  const [relatedDocsSlugline, setSlugline] = useState<string>('') // slugline for complementary planning- and quick-article documents
  const { t } = useTranslation()

  const handleSubmit = (setCreatePrompt: Dispatch<SetStateAction<boolean>>): void => {
    setCreatePrompt(true)
  }

  // Create a quick-article after flash creation
  const createAndSaveQuickArticle = (data: {
    documentStatus: CreateFlashDocumentStatus
    updatedPlanningId: string
    quickArticleData: QuickArticleData | undefined
  }, startDate: string | undefined) => {
    const { quickArticleData } = data

    if (!quickArticleData) {
      return
    }

    const quickArticleDocument = quickArticleDocumentTemplate(quickArticleData.deliverableId, quickArticleData.payload, quickArticleData.text)

    void (async () => {
      await repository?.saveDocument(
        quickArticleDocument,
        session?.accessToken || '',
        'draft'
      ).catch((error) => console.error('could not save quick-article document', error))

      createQuickArticleAfterFlash({
        planningId: data?.updatedPlanningId,
        timeZone,
        startDate,
        data: quickArticleData
      })
        .then((id) => {
          toast.success(t('flash:operations.quickArticleCreated'), {
            classNames: {
              title: 'whitespace-nowrap'
            },
            action: (
              <ToastAction
                key='open-article'
                documentId={id}
                withView='Editor'
                target='last'
                Icon={NewspaperIcon}
                label={t('common:actions.openType', { type: t('core:documentType.article') })}
              />
            )
          })
        })
        .catch(() => {
          // Flash creation OK, quick-article creation unsuccessful
          toast.error(t('errors:messages.createQuickArticleFailed'), {
            action: <ToastAction withView='Flash' documentId={data.updatedPlanningId} />
          })
        })
    })()
  }

  const handleCreationSuccess = (data: {
    documentStatus: CreateFlashDocumentStatus
    updatedPlanningId: string
    quickArticleData: QuickArticleData | undefined
  } | undefined, config: PromptConfig, startDate: string | undefined) => {
    // After flash has been successfully created, we celebrate with a toast
    toast.success(getLabel(data?.documentStatus, 'flash'), {
      action: (
        <ToastAction
          key='open-flash-1'
          documentId={ydoc.id}
          withView='Flash'
          target='last'
          Icon={ZapIcon}
          label={t('common:actions.openType', { type: t('core:documentType.planning') })}
        />
      )
    })

    if (data?.quickArticleData) {
      createAndSaveQuickArticle(data, startDate)
    }

    config.setPrompt(false)
    props.onDialogClose?.()
  }

  const configs = useMemo(() => promptConfig({
    type: 'flash',
    savePrompt,
    sendPrompt,
    donePrompt,
    setSavePrompt,
    setSendPrompt,
    setDonePrompt,
    selectedPlanning
  }), [donePrompt, savePrompt, sendPrompt, selectedPlanning, setDonePrompt, setSavePrompt, setSendPrompt])

  const handleCreationErrors = (ex: Error) => {
    console.error(ex)

    if (ex?.message === 'FlashCreationError') {
      // Both flash and quick-article creation were unsuccessful
      toast.error(t('errors:messages.flashCreationFailed'), {
        action: <ToastAction documentId={ydoc.id} withView='Flash' />
      })
    }

    if (ex?.message === 'CreateAssignmentError') {
      toast.error(t('errors:messages.createAssignmentError'), {
        action: <ToastAction documentId={ydoc.id} withView='Flash' />
      })
    }
  }

  if (!ydoc.provider?.isSynced) {
    return <></>
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <DocumentHeader
        view='Flash'
        asDialog={props.asDialog}
        ydoc={ydoc}
        readOnly={readOnly}
        onDialogClose={props.onDialogClose}
      />
      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            {props.asDialog && (
              <Form.Group icon={GanttChartSquareIcon}>
                <Awareness path='FlashPlanningItem' ref={planningAwareness} ydoc={ydoc}>
                  <ComboBox
                    max={1}
                    size='xs'
                    className='min-w-0 w-full truncate justify-start max-w-48'
                    selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                    placeholder={t('planning:move.pickPlanning')}
                    onOpenChange={(isOpen: boolean) => {
                      if (planningAwareness?.current) {
                        planningAwareness.current(isOpen)
                      }
                    }}
                    fetch={(query) => fetch(query, session, t, index, locale, timeZone, { searchOlder })}
                    minSearchChars={2}
                    modal={props.asDialog}
                    onSelect={(option) => {
                      const slugline = (option.payload as { slugline: string | undefined }).slugline

                      if (slugline) {
                        setSlugline(slugline)
                      }

                      if (option.value !== selectedPlanning?.value) {
                        setSelectedPlanning({
                          value: option.value,
                          label: option.label,
                          payload: option.payload
                        })

                        const sectionPayload = option.payload as { section: string | undefined }
                        const planningSection = allSections
                          .find((s) => s.id === sectionPayload?.section)
                        const sectionTitle = planningSection?.title

                        if (planningSection) {
                          setSection({
                            uuid: planningSection?.id,
                            title: planningSection?.title,
                            rel: 'section',
                            type: 'core/section'
                          })
                        }

                        if (sectionTitle && sectionPayload?.section) {
                          setYSection(Block.create({
                            type: 'core/section',
                            rel: 'section',
                            title: sectionTitle,
                            uuid: sectionPayload.section
                          }))
                        } else {
                          toast.error(t('errors:toasts.couldNotFindPlanningSection'))
                        }
                      } else {
                        setSelectedPlanning(undefined)
                      }
                    }}
                  >
                  </ComboBox>
                </Awareness>

                {!!selectedPlanning && (
                  <>
                    <Button
                      variant='ghost'
                      className='text-muted-foreground flex h-7 w-7 p-0 data-[state=open]:bg-muted hover:bg-accent2'
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedPlanning(undefined)
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
                  <Label htmlFor='SearchOlder' className='text-muted-foreground'>{t('core:labels.showOlder')}</Label>
                </>
              </Form.Group>
            )}


            {!selectedPlanning && props.asDialog && (
              <Form.Group icon={TagsIcon}>
                <Section ydoc={ydoc} path='links.core/section[0]' onSelect={setSection} />
              </Form.Group>
            )}

            <Form.Group icon={TagsIcon}>
              <input
                autoComplete='off'
                placeholder={t('flash:placeholders.sluggForTypes', { type1: t('core:documentType.planning'), type2: t('core:documentType.article') })}
                min={3}
                className='w-full text-sm rounded bg-background placeholder:pl-2 p-1 ring-offset-background'
                name='slugline'
                value={relatedDocsSlugline}
                onChange={(e) => {
                  const value = e.target.value.trim()
                  setSlugline(value)
                }}
              />
            </Form.Group>

            <>
              <Alert className='bg-red-300/35'>
                <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
                <AlertTitle>{t('flash:createFlashAlertTitle')}</AlertTitle>
                <AlertDescription>
                  {!selectedPlanning
                    ? (<>{t('flash:alertDescription1')}</>)
                    : (<>{t('flash:alertDescription2', { documentType: t('core:documentType.flash') })}</>)}
                </AlertDescription>
              </Alert>
            </>

            <DialogEditor ydoc={ydoc} setTitle={setTitle} type='flash' />

          </Form.Content>

          {
            configs.map((config) =>
              config.visible && (
                <CreatePrompt
                  key={config.key}
                  title={config.title}
                  description={config.description}
                  secondaryDescription={config.secondaryDescription}
                  secondaryLabel={config.secondaryLabel}
                  primaryLabel={config.primaryLabel}
                  onPrimary={() => {
                    if (!ydoc.provider || !props.documentId || !session) {
                      console.error('Environment is not sane, flash cannot be created')
                      return
                    }

                    const { startDate } = (selectedPlanning?.payload ?? {}) as {
                      startDate?: string
                    }

                    createFlash({
                      ydoc,
                      status,
                      session,
                      planningId: selectedPlanning?.value,
                      timeZone,
                      documentStatus: config.documentStatus,
                      startDate,
                      section: (!selectedPlanning?.value) ? section || undefined : undefined,
                      planningSection: section,
                      relatedDocsSlugline
                    })
                      .then((data) => {
                        handleCreationSuccess(data, config, startDate)
                      })
                      .catch((ex: Error) => {
                        handleCreationErrors(ex)
                      })
                  }}
                  onSecondary={() => {
                    config.setPrompt(false)
                  }}
                />
              )
            )
          }

          {props.asDialog && (
            <Form.Footer>
              <Form.Submit
                onSubmit={() => handleSubmit(setSendPrompt)}
                onSecondarySubmit={() => handleSubmit(setSavePrompt)}
                onTertiarySubmit={() => handleSubmit(setDonePrompt)}
              >
                <div className='flex justify-between'>
                  <div className='flex gap-2'>
                    <Button variant='secondary' type='button' role='secondary'>{t('core:status.draft')}</Button>
                    <Button variant='secondary' type='button' role='tertiary'>{t('common:actions.markAsDone')}</Button>
                  </div>
                  <Button type='submit' role='primary'>{t('core:status.action.publish')}</Button>
                </div>
              </Form.Submit>
            </Form.Footer>
          )}
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
