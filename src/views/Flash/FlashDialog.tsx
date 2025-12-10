import {
  Awareness,
  Section,
  View
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { Button, Checkbox, ComboBox, Label } from '@ttab/elephant-ui'
import { CircleXIcon, TagsIcon, GanttChartSquareIcon } from '@ttab/elephant-ui/icons'
import { useRegistry, useSections } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { Dispatch, SetStateAction } from 'react'
import { useRef, useState } from 'react'
import { FlashEditor } from './FlashDialogEditor'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import type { CreateFlashDocumentStatus } from './lib/createFlash'
import { createFlash } from './lib/createFlash'
import { CreatePrompt } from '@/components/CreatePrompt'
import { FlashHeader } from './FlashHeader'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import { useYDocument, useYValue } from '@/modules/yjs/hooks'
import type { EleDocumentResponse } from '@/shared/types'
import type { QuickArticleData } from '@/shared/types'
import type * as Y from 'yjs'
import { createQuickArticle } from './lib/createQuickArticle'
import { ToastAction } from './ToastAction'
import { quickArticleDocumentTemplate } from '@/shared/templates/quickArticleDocumentTemplate'

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
  const [selectedPlanning, setSelectedPlanning] = useState<Omit<DefaultValueOption, 'payload'> & { payload: unknown } | undefined>(undefined)
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

  const handleSubmit = (setCreatePrompt: Dispatch<SetStateAction<boolean>>): void => {
    setCreatePrompt(true)
  }

  const getLabel = (documentStatus: CreateFlashDocumentStatus): string => {
    switch (documentStatus) {
      case 'usable': {
        return 'Flash skickad'
      }
      case 'done': {
        return 'Flash godkänd'
      }
      default: {
        return 'Flash sparad'
      }
    }
  }

  const createAndSaveQuickArticle = (data: {
    documentStatus: CreateFlashDocumentStatus
    updatedPlanningId: string
    quickArticleData: QuickArticleData | undefined
  }, startDate: string | undefined) => {
    const { quickArticleData } = data

    if (!quickArticleData) {
      return
    }

    const quickArticleDocument = quickArticleDocumentTemplate(quickArticleData.deliverableId, quickArticleData.text, quickArticleData.payload)

    void (async () => {
      await repository?.saveDocument(
        quickArticleDocument,
        session?.accessToken || '',
        'draft'
      ).catch((error) => console.error('could not save quick-article document', error))

      createQuickArticle({
        planningId: data?.updatedPlanningId,
        timeZone,
        startDate,
        data: quickArticleData
      })
        .then(() => {
          toast.success('Snabbartikel har skapats', {
            action: <ToastAction planningId={data?.updatedPlanningId} flashId={ydoc.id} />
          })
        })
        .catch(() => {
          // Flash creation OK, quick-article creation unsuccessful
          toast.error('Fel när snabbartikel skapades', {
            action: <ToastAction planningId={data.updatedPlanningId} flashId={ydoc.id} />
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
    toast.success(getLabel(data?.documentStatus), {
      action: <ToastAction planningId={data?.updatedPlanningId} flashId={ydoc.id} />
    })

    if (data?.quickArticleData) {
      createAndSaveQuickArticle(data, startDate)
    }

    config.setPrompt(false)
    props.onDialogClose?.()
  }

  const handleCreationErrors = (ex: Error) => {
    console.error(ex)

    if (ex?.message === 'FlashCreationError') {
      // Both flash and quick-article creation were unsuccessful
      toast.error('Flashen kunde inte skapas.', {
        action: <ToastAction flashId={ydoc.id} />
      })
    }

    if (ex?.message === 'CreateAssignmentError') {
      toast.error('Flashen har skapats. Tyvärr misslyckades det att koppla den till en planering.', {
        action: <ToastAction flashId={ydoc.id} />
      })
    }
  }

  const promptConfig: PromptConfig[] = [
    {
      visible: sendPrompt,
      key: 'send',
      title: 'Skapa och skicka flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}".`,
      secondaryDescription: 'I samma planering kommer även ett textuppdrag med flashinnehållet att läggas till.',
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Skicka',
      documentStatus: 'usable' as CreateFlashDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: 'Skapa och klarmarkera flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}". Med status klar.`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Klarmarkera',
      documentStatus: 'done' as CreateFlashDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: 'Spara flash?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
        : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Spara',
      documentStatus: undefined,
      setPrompt: setSavePrompt
    }
  ]

  if (!ydoc.provider?.isSynced) {
    return <></>
  }

  return (
    <View.Root asDialog={props.asDialog} className={props.className}>
      <FlashHeader ydoc={ydoc} asDialog={props.asDialog} onDialogClose={props.onDialogClose} readOnly={readOnly} />
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
                    placeholder='Välj planering'
                    onOpenChange={(isOpen: boolean) => {
                      if (planningAwareness?.current) {
                        planningAwareness.current(isOpen)
                      }
                    }}
                    fetch={(query) => fetch(query, session, index, locale, timeZone, { searchOlder })}
                    minSearchChars={2}
                    modal={props.asDialog}
                    onSelect={(option) => {
                      if (option.value !== selectedPlanning?.value) {
                        setSelectedPlanning({
                          value: option.value,
                          label: option.label,
                          payload: option.payload
                        })

                        const sectionPayload = option.payload as { section: string | undefined }
                        const sectionTitle = allSections
                          .find((s) => s.id === sectionPayload?.section)?.title

                        if (sectionTitle && sectionPayload?.section) {
                          setYSection(Block.create({
                            type: 'core/section',
                            rel: 'section',
                            title: sectionTitle,
                            uuid: sectionPayload.section
                          }))
                        } else {
                          toast.error('Kunde inte hitta sektionen för planeringen')
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
                  <Label htmlFor='SearchOlder' className='text-muted-foreground'>Visa äldre</Label>
                </>
              </Form.Group>
            )}


            {!selectedPlanning && props.asDialog && (
              <Form.Group icon={TagsIcon}>
                <Section ydoc={ydoc} path='links.core/section[0]' onSelect={setSection} />
              </Form.Group>
            )}

            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (<>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>)
                : (<>Denna flash kommer läggas i ett nytt uppdrag i den valda planeringen</>)}
            </UserMessage>

            <FlashEditor ydoc={ydoc} setTitle={setTitle} />

          </Form.Content>

          {
            promptConfig.map((config) =>
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
                      section: (!selectedPlanning?.value) ? section || undefined : undefined
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

          {
            props.asDialog && (
              <Form.Footer>
                <Form.Submit
                  onSubmit={() => handleSubmit(setSendPrompt)}
                  onSecondarySubmit={() => handleSubmit(setSavePrompt)}
                  onTertiarySubmit={() => handleSubmit(setDonePrompt)}
                >
                  <div className='flex justify-between'>
                    <div className='flex gap-2'>
                      <Button variant='secondary' type='button' role='secondary'>Utkast</Button>
                      <Button variant='secondary' type='button' role='tertiary'>Klarmarkera</Button>
                    </div>
                    <Button type='submit' role='primary'>Publicera</Button>
                  </div>
                </Form.Submit>
              </Form.Footer>
            )
          }
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}
