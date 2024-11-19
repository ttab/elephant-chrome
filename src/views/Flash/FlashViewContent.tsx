import {
  ViewHeader,
  Awareness,
  Section
} from '@/components'
import type { DefaultValueOption, ViewProps } from '@/types'
import { NewsvalueMap } from '@/defaults'
import { Button, ComboBox, ScrollArea, Separator, Alert, AlertDescription } from '@ttab/elephant-ui'
import { CircleXIcon, ZapIcon, InfoIcon, Tags, GanttChartSquare } from '@ttab/elephant-ui/icons'
import { useCollaboration, useYValue, useIndexUrl, useRegistry } from '@/hooks'
import type * as Y from 'yjs'
import { cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Planning, Plannings } from '@/lib/index'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { FlashEditor } from './FlashEditor'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { createDocument } from '@/lib/createYItem'
import * as Templates from '@/defaults/templates'
import { Prompt } from '../Planning/components/Prompt'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type Session } from 'next-auth'
import { addFlashToPlanning } from './addFlashToPlanning'
import { addAssignmentLinkToFlash } from './addAssignmentToFlash'
import { type EleBlock } from '@/shared/types'
import { getValueByYPath } from '@/lib/yUtils'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Form } from '@/components/Form'

export const FlashViewContent = (props: ViewProps & {
  documentId: string
}): JSX.Element | undefined => {
  const { provider } = useCollaboration()
  const { status, data: session } = useSession()
  const indexUrl = useIndexUrl()
  const { timeZone } = useRegistry()
  const planningAwareness = useRef<(value: boolean) => void>(null)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [selectedPlanning, setSelectedPlanning] = useState<DefaultValueOption | undefined>(undefined)
  const [title, setTitle] = useYValue<string | undefined>('root.title', true)
  const [, setSection] = useYValue<EleBlock | undefined>('links.core/section[0]')
  const [author] = useYValue<EleBlock | undefined>('links.core/author[0]')

  const [newPlanningId, newPlanningYDoc] = useMemo(() => {
    return createDocument(Templates.planning, true, {})
  }, [])

  // New and empty planning document for when creating new flash and planning
  const { document: newPlanningDocument } = useCollaborationDocument({
    documentId: newPlanningId,
    initialDocument: newPlanningYDoc
  })

  // Existing planning document for when adding flash to existing
  const { document: planningDocument } = useCollaborationDocument({
    documentId: selectedPlanning?.value
  })

  useEffect(() => {
    if (planningDocument) {
      const [planningSection] = getValueByYPath<EleBlock>(planningDocument.getMap('ele'), 'links.core/section[0]')
      if (planningSection) {
        setSection(planningSection)
      }
    }
  }, [planningDocument, setSection])


  //  Helper function to search for planning items.
  const fetchAsyncData = async (str: string): Promise<DefaultValueOption[]> => {
    if (!session || !indexUrl) {
      return []
    }

    const { startTime, endTime } = getDateTimeBoundaries(new Date())
    const result = await Plannings.search(indexUrl, session.accessToken, {
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime),
        end: convertToISOStringInUTC(endTime),
        text: str
      }
    })

    if (!result.ok) {
      return []
    }

    const newOptions = result.hits.map((planning: Planning) => {
      const id = planning._id
      const title = planning._source['document.title']?.[0]
      const newsvalue = NewsvalueMap[planning._source['document.meta.core_newsvalue.value']?.[0]]

      const info = [
        planning._source['document.meta.tt_slugline.value']?.[0],
        planning._source['document.rel.section.title']?.[0]
      ].filter((v) => v).join(', ')

      return {
        value: id,
        label: title,
        info: info ? ` - ${info}` : '',
        icon: newsvalue.icon,
        iconProps: newsvalue.iconProps
      }
    })

    return newOptions
  }

  const viewVariants = cva('flex flex-col', {
    variants: {
      asCreateDialog: {
        false: 'h-screen',
        true: 'overflow-hidden'
      }
    }
  })

  const handleSubmit = (): void => {
    if (!planningDocument && !newPlanningDocument) {
      return
    }
    setShowVerifyDialog(true)
  }

  return (
    <div className={cn(viewVariants({ asCreateDialog: !!props.asDialog, className: props?.className }))}>
      <div className='grow-0'>
        <ViewHeader.Root>
          {!props.asDialog
          && <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF5150' />}

          <ViewHeader.Content>
            <div className='flex w-full h-full items-center space-x-2 font-bold'>
              <ViewHeader.Title title='Flash' icon={ZapIcon} iconColor='#FF3140' />
            </div>
          </ViewHeader.Content>

          <ViewHeader.Action onDialogClose={props.onDialogClose}>
            {!props.asDialog && !!props.documentId
            && <ViewHeader.RemoteUsers documentId={props.documentId} />}
          </ViewHeader.Action>
        </ViewHeader.Root>
      </div>

      <ScrollArea className='grid @5xl:place-content-center'>
        <Form.Root asDialog={props.asDialog}>
          <Form.Content>
            <Form.Group icon={GanttChartSquare}>
              <Awareness name='FlashPlanningItem' ref={planningAwareness}>
                <ComboBox
                  max={1}
                  size='xs'
                  className='min-w-0 max-w-46 truncate justify-start'
                  selectedOptions={selectedPlanning ? [selectedPlanning] : []}
                  placeholder='Välj planering'
                  onOpenChange={(isOpen: boolean) => {
                    if (planningAwareness?.current) {
                      planningAwareness.current(isOpen)
                    }
                  }}
                  fetch={fetchAsyncData}
                  minSearchChars={2}
                  onSelect={(option) => {
                    if (option.value !== selectedPlanning?.value) {
                      setSelectedPlanning({
                        value: option.value,
                        label: option.label
                      })
                    } else {
                      setSelectedPlanning(undefined)
                    }
                  }}
                >
                </ComboBox>
              </Awareness>

              {!!selectedPlanning
              && (
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
            </Form.Group>


            {!selectedPlanning
            && (
              <Form.Group icon={Tags}>
                <Section />
              </Form.Group>
            )}

            <FlashEditor setTitle={setTitle} />

            <Alert className='bg-gray-50'>
              <InfoIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
              <AlertDescription>
                {!selectedPlanning
                  ? <>Väljer du ingen planering kommer en ny planering med tillhörande uppdrag skapas åt dig.</>
                  : <>Denna flash kommer läggas i ett nytt uppdrag i den valda planeringen</>}
              </AlertDescription>
            </Alert>

          </Form.Content>

          {
            showVerifyDialog
            && (
              <Prompt
                title='Skapa och skicka flash?'
                description={!selectedPlanning
                  ? 'En ny planering med tillhörande uppdrag för denna flash kommer att skapas åt dig.'
                  : `Denna flash kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}`}
                secondaryLabel='Avbryt'
                primaryLabel='Skicka'
                onPrimary={() => {
                  if (!provider || !props.documentId || !provider || !session) {
                    console.error('Environment is not sane, flash cannot be created')
                    return
                  }

                  if (props?.onDialogClose) {
                    props.onDialogClose(props.documentId, title)
                  }

                  createFlash(props.documentId, title, provider, status, session, planningDocument, newPlanningDocument, timeZone, author)

                  setShowVerifyDialog(false)
                }}
                onSecondary={() => {
                  setShowVerifyDialog(false)
                }}
              />
            )
          }

          {
            props.asDialog && (
              <Form.Submit onSubmit={handleSubmit}>
                <div>
                  <Separator className='ml-0' />

                  <div className='flex justify-end px-6 py-4'>
                    <Button type='submit'>Skicka flash</Button>
                  </div>
                </div>
              </Form.Submit>
            )
          }
        </Form.Root>
      </ScrollArea>
    </div>
  )
}

function createFlash(
  documentId: string,
  title: string | undefined,
  provider: HocuspocusProvider,
  status: string,
  session: Session,
  planningDocument: Y.Doc | undefined,
  newPlanningDocument: Y.Doc | undefined,
  timeZone: string,
  author: EleBlock | undefined
): void {
  if (provider && status === 'authenticated') {
    // First and foremost we persist the flash, it needs an assignment
    const assignmentId = crypto.randomUUID()
    addAssignmentLinkToFlash(provider.document, assignmentId)

    if (author) {
      Block.create({
        type: 'core/author',
        rel: 'author',
        uuid: author.uuid,
        title: author.title
      })
    }

    provider.sendStateless(
      createStateless(StatelessType.IN_PROGRESS, {
        state: false,
        id: documentId,
        context: {
          accessToken: session.accessToken,
          user: session.user,
          type: 'Flash'
        }
      })
    )

    // Next we add it to an assignment in a planning.
    try {
      if (planningDocument || newPlanningDocument) {
        const planningId = addFlashToPlanning(
          provider.document,
          // @ts-expect-error Typescript don't understand the safeguard above
          planningDocument ?? newPlanningDocument,
          assignmentId,
          timeZone
        )

        provider.sendStateless(
          createStateless(StatelessType.IN_PROGRESS, {
            state: false,
            id: planningId,
            context: {
              accessToken: session.accessToken,
              user: session.user,
              type: 'Planning'
            }
          })
        )
      } else {
        throw new Error(`Failed adding flash ${documentId} - ${title} to a planning`)
      }
    } catch (err) {
      // We won't let errors interfere with the publishing of the flash.
      console.error(err)
    }
  }
}
