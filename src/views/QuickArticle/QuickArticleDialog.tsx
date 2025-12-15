import {
  Awareness,
  Newsvalue,
  Section,
  View
} from '@/components'
import { Button, Checkbox, ComboBox, Label } from '@ttab/elephant-ui'
import { CircleXIcon, TagsIcon, GanttChartSquareIcon, NewspaperIcon } from '@ttab/elephant-ui/icons'
import { useRegistry, useSections } from '@/hooks'
import { useSession } from 'next-auth/react'
import { useRef, useState } from 'react'
import { UserMessage } from '@/components/UserMessage'
import { Form } from '@/components/Form'
import { fetch } from '@/lib/index/fetch-plannings-twirp'
import { CreatePrompt } from '@/components/CreatePrompt'
import { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import { useYDocument, useYValue, type YDocument } from '@/modules/yjs/hooks'
import { ToastAction } from '@/components/ToastAction'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { type CreateArticleDocumentStatus, createQuickArticle } from './lib/createQuickArticle'
import type { DefaultValueOption, ViewProps } from '@/types'
import type { Dispatch, JSX, SetStateAction } from 'react'
import type { EleDocumentResponse } from '@/shared/types'
import type * as Y from 'yjs'
import { DocumentHeader } from '@/components/QuickDocument/DocumentHeader'
import { DialogEditor } from '@/components/QuickDocument/DialogEditor'
import { toSlateYXmlText } from '@/shared/yUtils'

type PromptConfig = {
  visible: boolean
  key: string
  title: string
  description: string
  secondaryDescription?: string
  secondaryLabel: string
  primaryLabel: string
  documentStatus: CreateArticleDocumentStatus
  setPrompt: Dispatch<SetStateAction<boolean>>
}

export const QuickArticleDialog = (props: {
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
  const { index, locale, timeZone } = useRegistry()
  const [searchOlder, setSearchOlder] = useState(false)

  const [section, setSection] = useState<{
    type: string
    rel: string
    uuid: string
    title: string
  } | undefined>(undefined)

  const allSections = useSections()
  const [, setYSection] = useYValue<Block | undefined>(ydoc.ele, 'links.core/section[0]')

  const [slugline, setSlugline] = useYValue<Y.XmlText>(ydoc.ele, 'meta.tt/slugline[0].value', true)

  const handleSubmit = (setCreatePrompt: Dispatch<SetStateAction<boolean>>): void => {
    setCreatePrompt(true)
  }

  const handleClose = (config: PromptConfig) => {
    config.setPrompt(false)
    props.onDialogClose?.()
  }

  const promptConfig: PromptConfig[] = [
    {
      visible: sendPrompt,
      key: 'send',
      title: 'Skapa och skicka artikel?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna artikel kommer att skapas åt dig.'
        : `Denna artikel kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}".`,
      secondaryDescription: 'I samma planering kommer även ett textuppdrag med artikelinnehållet att läggas till.',
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Publicera',
      documentStatus: 'usable' as CreateArticleDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: 'Skapa och klarmarkera artikel?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna artikel kommer att skapas åt dig.'
        : `Denna artikel kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}". Med status klar.`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Klarmarkera',
      documentStatus: 'done' as CreateArticleDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: 'Spara artikel?',
      description: !selectedPlanning
        ? 'En ny planering med tillhörande uppdrag för denna artikel kommer att skapas åt dig.'
        : `Denna artikel kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`,
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
      <DocumentHeader
        view='QuickArticle'
        asDialog={props.asDialog}
        ydoc={{ id: props.documentId } as YDocument<Y.Map<unknown>>}
        readOnly
        onDialogClose={props.onDialogClose}
      />
      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            {props.asDialog && (
              <Form.Group icon={GanttChartSquareIcon}>
                <Awareness ref={planningAwareness} ydoc={ydoc}>
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


                        const getPlanningSlugline = (payload: { slugline?: string } | undefined): string | undefined => {
                          if (!payload || !payload.slugline) {
                            return
                          }

                          const { slugline } = payload as { slugline?: string }
                          return slugline
                        }

                        const planningSlugline = getPlanningSlugline(option.payload as { slugline?: string })

                        if (planningSlugline) {
                          setSlugline(toSlateYXmlText(planningSlugline))
                        }

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
                )}
                <Checkbox
                  id='SearchOlder'
                  defaultChecked={searchOlder}
                  onCheckedChange={(checked: boolean) => { setSearchOlder(checked) }}
                />
                <Label htmlFor='SearchOlder' className='text-muted-foreground'>Visa äldre</Label>
              </Form.Group>
            )}


            {!selectedPlanning && props.asDialog && (
              <Form.Group icon={TagsIcon}>
                <Section ydoc={ydoc} path='links.core/section[0]' onSelect={setSection} />
              </Form.Group>
            )}

            <Form.Group icon={TagsIcon}>

              {selectedPlanning && (
                <SluglineEditable
                  key={selectedPlanning?.value}
                  ydoc={ydoc}
                  value={slugline}
                />
              )}

              {!selectedPlanning && (
                <SluglineEditable
                  ydoc={ydoc}
                  value={slugline}
                  documentStatus='draft'
                />
              )}
              <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />
            </Form.Group>

            <UserMessage asDialog={!!props?.asDialog}>
              {!selectedPlanning
                ? (<>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>)
                : (<>Denna artikel kommer läggas i ett nytt uppdrag i den valda planeringen</>)}
            </UserMessage>

            <DialogEditor ydoc={ydoc} setTitle={setTitle} />

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
                      console.error('Environment is not sane, article cannot be created')
                      return
                    }

                    const { startDate } = (selectedPlanning?.payload ?? {}) as {
                      startDate?: string
                    }

                    createQuickArticle({
                      ydoc,
                      status,
                      session,
                      planningId: selectedPlanning?.value,
                      documentStatus: config.documentStatus,
                      timeZone,
                      startDate,
                      slugline: slugline ? slugline?.toString() as string : undefined,
                      section: (!selectedPlanning?.value) ? section || undefined : undefined
                    })
                      .then(() => {
                        toast.success('Snabbartikel har skapats', {
                          action: (
                            <ToastAction
                              key='open-article'
                              documentId={ydoc.id}
                              withView='Editor'
                              target='last'
                              Icon={NewspaperIcon}
                              label='Öppna artikel'
                            />
                          )
                        })

                        handleClose(config)
                      })
                      .catch(() => {
                        toast.error('Fel när snabbartikel skapades')
                      })
                  }}
                  onSecondary={() => {
                    handleClose(config)
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
